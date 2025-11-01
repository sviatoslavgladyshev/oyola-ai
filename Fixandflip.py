import pandas as pd
from typing import Dict, List, Any, Optional


class FixAndFlipProfile:
	"""Profile class for fix-and-flip property analysis with tag-driven methods."""
	
	def __init__(self, property_df: pd.DataFrame, config: Optional[Dict[str, Any]] = None):
		"""Initialize the profile with property data and optional configuration.
		
		Args:
			property_df: DataFrame containing property listings with columns like
				price, squareFeet, bedrooms, bathrooms, etc.
			config: Optional configuration dict with keys like:
				- realtor_commission: commission rate (default 0.03 for 3%)
				- arp_weight_ppsf: weight for PPSF in ARP calculation
				- arp_weight_comps: weight for comps in ARP calculation
		"""
		self.property_df = property_df.copy()
		self.config = config or {}
		# Store computed results as we add columns
		self._results = {}
	
	def compute_70_percent_method(self, tags: List[str]) -> pd.DataFrame:
		"""Compute maximum offer using 70% rule: (ARP * 0.70) - renovation_cost.
		
		If "buying_from_realtor" tag is present, adjusts for realtor commission.
		
		Args:
			tags: List of tags that may include "buying_from_realtor"
			
		Returns:
			DataFrame with added columns: max_offer_70_percent, adjusted_asking_price
		"""
		df = self.property_df.copy()
		
		# Ensure required columns exist (ARP and renovation_cost should be computed first)
		if "arp" not in df.columns:
			# If ARP not computed yet, use price as placeholder (should call compute_arp first)
			df["arp"] = df.get("price", 0)
		if "renovation_cost" not in df.columns:
			df["renovation_cost"] = 0
		
		# Check for buying_from_realtor sub-tag
		if "buying_from_realtor" in tags:
			commission_rate = self.config.get("realtor_commission", 0.03)
			# Adjust asking price to account for commission
			# Commission is typically on purchase price, so effective cost is: price / (1 - commission_rate)
			df["adjusted_asking_price"] = df["price"] / (1 - commission_rate)
			df["realtor_commission_cost"] = df["adjusted_asking_price"] - df["price"]
		else:
			df["adjusted_asking_price"] = df["price"]
			df["realtor_commission_cost"] = 0
		
		# Compute 70% rule: max offer = (ARP * 0.70) - renovation_cost - commission_cost
		df["max_offer_70_percent"] = (df["arp"] * 0.70) - df["renovation_cost"] - df["realtor_commission_cost"]
		df["profit_potential_70_percent"] = df["arp"] - df["max_offer_70_percent"] - df["renovation_cost"] - df["realtor_commission_cost"]
		
		# Update the internal DataFrame
		self.property_df = df
		return df
	
	def compute_ppsf_estimate(self, tags: List[str]) -> pd.DataFrame:
		"""Compute price-per-square-foot estimates by city/state.
		
		Calculates median PPSF by location and estimates value based on square footage.
		
		Args:
			tags: List of tags that may include modifiers like "exclude_pending"
			
		Returns:
			DataFrame with added columns: ppsf, median_ppsf_by_location, ppsf_estimate
		"""
		df = self.property_df.copy()
		
		# Calculate PPSF for each property
		df["ppsf"] = df["price"] / df["squareFeet"].replace(0, 1)  # Avoid division by zero
		
		# Filter out pending/sold if tag is present
		filter_df = df.copy()
		if "exclude_pending" in tags:
			filter_df = filter_df[filter_df.get("status", "") != "Pending"]
		if "exclude_sold" in tags:
			filter_df = filter_df[filter_df.get("status", "") != "Sold"]
		
		# Group by city and state to compute median PPSF
		if "city" in df.columns and "state" in df.columns:
			median_ppsf = filter_df.groupby(["city", "state"])["ppsf"].median().to_dict()
			# Map median PPSF to each property
			df["median_ppsf_by_location"] = df.apply(
				lambda row: median_ppsf.get((row["city"], row["state"]), df["ppsf"].median()),
				axis=1
			)
		else:
			# Fallback to overall median
			df["median_ppsf_by_location"] = filter_df["ppsf"].median()
		
		# Estimate value based on square footage and median PPSF
		df["ppsf_estimate"] = df["squareFeet"] * df["median_ppsf_by_location"]
		
		# Update internal DataFrame
		self.property_df = df
		return df
	
	def compute_comps_estimate(self, tags: List[str]) -> pd.DataFrame:
		"""Compute comparable sales estimates using similar properties.
		
		Filters comparable properties by city, similar square footage, bedrooms, bathrooms.
		
		Args:
			tags: List of tags that may include "same_zip_only" or "radius_miles:X"
			
		Returns:
			DataFrame with added columns: comps_estimate, num_comps, comp_median_price
		"""
		df = self.property_df.copy()
		
		# Tolerance parameters
		sqft_tolerance_pct = 0.20  # ±20% square footage
		bed_tolerance = 1  # ±1 bedroom
		bath_tolerance = 1  # ±1 bathroom
		
		comps_estimates = []
		num_comps_list = []
		
		for idx, row in df.iterrows():
			# Filter comparable properties (exclude current property)
			comps = df[df.index != idx].copy()
			
			# Filter by city if available
			if "city" in df.columns:
				comps = comps[comps["city"] == row["city"]]
			
			# Filter by zip if tag is present
			if "same_zip_only" in tags and "zip" in df.columns:
				comps = comps[comps["zip"] == row["zip"]]
			
			# Filter by similar square footage (±20%)
			sqft_min = row["squareFeet"] * (1 - sqft_tolerance_pct)
			sqft_max = row["squareFeet"] * (1 + sqft_tolerance_pct)
			comps = comps[(comps["squareFeet"] >= sqft_min) & (comps["squareFeet"] <= sqft_max)]
			
			# Filter by similar bedrooms (±1)
			if "bedrooms" in df.columns:
				bed_min = max(0, row["bedrooms"] - bed_tolerance)
				bed_max = row["bedrooms"] + bed_tolerance
				comps = comps[(comps["bedrooms"] >= bed_min) & (comps["bedrooms"] <= bed_max)]
			
			# Filter by similar bathrooms (±1)
			if "bathrooms" in df.columns:
				bath_min = max(0, row["bathrooms"] - bath_tolerance)
				bath_max = row["bathrooms"] + bath_tolerance
				comps = comps[(comps["bathrooms"] >= bath_min) & (comps["bathrooms"] <= bath_max)]
			
			# Exclude pending/sold if tag present
			if "exclude_pending" in tags and "status" in comps.columns:
				comps = comps[comps["status"] != "Pending"]
			if "exclude_sold" in tags and "status" in comps.columns:
				comps = comps[comps["status"] != "Sold"]
			
			# Calculate estimate from comps (median price of comparable properties)
			if len(comps) > 0:
				comps_estimate = comps["price"].median()
				num_comps = len(comps)
			else:
				# Fallback to property's own price if no comps found
				comps_estimate = row["price"]
				num_comps = 0
			
			comps_estimates.append(comps_estimate)
			num_comps_list.append(num_comps)
		
		df["comps_estimate"] = comps_estimates
		df["num_comps"] = num_comps_list
		df["comp_median_price"] = df["comps_estimate"]  # Alias for clarity
		
		# Update internal DataFrame
		self.property_df = df
		return df
	
	def compute_arp(self, tags: List[str]) -> pd.DataFrame:
		"""Compute After Repair Value (ARP) by blending PPSF and comps estimates.
		
		Args:
			tags: List of tags that may include weighting preferences
			
		Returns:
			DataFrame with added column: arp
		"""
		df = self.property_df.copy()
		
		# Ensure PPSF and comps estimates exist (compute if needed)
		if "ppsf_estimate" not in df.columns:
			df = self.compute_ppsf_estimate(tags)
		if "comps_estimate" not in df.columns:
			df = self.compute_comps_estimate(tags)
		
		# Get weights from config or use defaults
		weight_ppsf = self.config.get("arp_weight_ppsf", 0.5)
		weight_comps = self.config.get("arp_weight_comps", 0.5)
		
		# Normalize weights to sum to 1.0
		total_weight = weight_ppsf + weight_comps
		if total_weight > 0:
			weight_ppsf /= total_weight
			weight_comps /= total_weight
		else:
			weight_ppsf = 0.5
			weight_comps = 0.5
		
		# Blend estimates: ARP = (weight_ppsf * ppsf_estimate) + (weight_comps * comps_estimate)
		df["arp"] = (weight_ppsf * df["ppsf_estimate"]) + (weight_comps * df["comps_estimate"])
		
		# Update internal DataFrame
		self.property_df = df
		return df
	
	def compute_renovation_cost(self, tags: List[str]) -> pd.DataFrame:
		"""Estimate renovation costs based on square footage and property characteristics.
		
		Args:
			tags: List of tags that may include "include_permit_costs", "high_end_renovation", etc.
			
		Returns:
			DataFrame with added columns: renovation_cost, renovation_cost_per_sqft
		"""
		df = self.property_df.copy()
		
		# Base cost per square foot (typical renovation range: $20-75/sqft)
		base_cost_per_sqft = 50.0  # Default moderate renovation
		
		# Adjust based on tags
		if "high_end_renovation" in tags:
			base_cost_per_sqft = 100.0  # Luxury renovation
		elif "basic_renovation" in tags:
			base_cost_per_sqft = 25.0  # Minimal updates
		
		# Calculate base renovation cost
		df["renovation_cost_per_sqft"] = base_cost_per_sqft
		df["renovation_cost"] = df["squareFeet"] * base_cost_per_sqft
		
		# Add permit costs if tag is present
		if "include_permit_costs" in tags:
			permit_cost_base = self.config.get("permit_cost_base", 5000)  # Base permit cost
			permit_cost_per_sqft = self.config.get("permit_cost_per_sqft", 2.0)
			permit_cost = permit_cost_base + (df["squareFeet"] * permit_cost_per_sqft)
			df["permit_cost"] = permit_cost
			df["renovation_cost"] += df["permit_cost"]
		else:
			df["permit_cost"] = 0
		
		# Additional costs for bedrooms/bathrooms if tag present
		if "itemize_room_costs" in tags:
			bedroom_cost = self.config.get("bedroom_renovation_cost", 5000)
			bathroom_cost = self.config.get("bathroom_renovation_cost", 10000)
			if "bedrooms" in df.columns:
				df["bedroom_renovation_cost"] = df["bedrooms"] * bedroom_cost
				df["renovation_cost"] += df["bedroom_renovation_cost"]
			if "bathrooms" in df.columns:
				df["bathroom_renovation_cost"] = df["bathrooms"] * bathroom_cost
				df["renovation_cost"] += df["bathroom_renovation_cost"]
		
		# Update internal DataFrame
		self.property_df = df
		return df
	
	def compute_roi(self, tags: List[str]) -> pd.DataFrame:
		"""Compute Return on Investment (ROI) percentage.
		
		ROI = (Profit / Total Investment) * 100
		where Profit = ARP - Purchase Price - Renovation Cost - Other Costs
		
		Args:
			tags: List of tags that may affect cost calculations
			
		Returns:
			DataFrame with added columns: roi, total_investment, profit, roi_percentage
		"""
		df = self.property_df.copy()
		
		# Ensure ARP is computed
		if "arp" not in df.columns:
			df = self.compute_arp(tags)
		
		# Ensure renovation cost is computed
		if "renovation_cost" not in df.columns:
			df = self.compute_renovation_cost(tags)
		
		# Purchase price (use adjusted price if realtor commission was applied)
		purchase_price = df.get("adjusted_asking_price", df["price"])
		
		# Other costs (closing costs, holding costs, etc.)
		closing_cost_rate = self.config.get("closing_cost_rate", 0.03)  # 3% of purchase price
		holding_cost_months = self.config.get("holding_cost_months", 6)  # Months to hold
		monthly_holding_cost = self.config.get("monthly_holding_cost", 1000)  # Insurance, utilities, etc.
		
		df["closing_costs"] = purchase_price * closing_cost_rate
		df["holding_costs"] = holding_cost_months * monthly_holding_cost
		df["other_costs"] = df["closing_costs"] + df["holding_costs"]
		
		# Total investment
		df["total_investment"] = purchase_price + df["renovation_cost"] + df["other_costs"]
		
		# Profit = ARP - Total Investment
		df["profit"] = df["arp"] - df["total_investment"]
		
		# ROI percentage = (Profit / Total Investment) * 100
		df["roi"] = (df["profit"] / df["total_investment"].replace(0, 1)) * 100
		df["roi_percentage"] = df["roi"]
		
		# Update internal DataFrame
		self.property_df = df
		return df


def run_fix_and_flip_analysis(
	properties_df: pd.DataFrame,
	tags: List[str],
	config: Optional[Dict[str, Any]] = None
) -> pd.DataFrame:
	"""External conditional logic that calls FixAndFlipProfile methods based on tags.
	
	This function contains if/elif statements outside the class that determine
	which methods to call based on tag combinations.
	
	Args:
		properties_df: DataFrame with property listings
		tags: List of tags like ["repairing_properties", "70_percent_method", "buying_from_realtor"]
		config: Optional configuration dictionary
		
	Returns:
		DataFrame with computed analysis columns added based on which tags were active
	"""
	profile = FixAndFlipProfile(properties_df, config)
	df = profile.property_df.copy()
	
	# External conditional logic based on tags
	# Repair/renovation related analyses
	if "repairing_properties" in tags or "renovation" in tags:
		# Compute renovation costs first (needed for other calculations)
		if "renovation_cost" in tags or "repairing_properties" in tags:
			df = profile.compute_renovation_cost(tags)
			profile.property_df = df
		
		# Compute ARP (after repair value) if requested
		if "arp_estimate" in tags or "arp" in tags:
			df = profile.compute_arp(tags)
			profile.property_df = df
		
		# 70% method if requested
		if "70_percent_method" in tags:
			df = profile.compute_70_percent_method(tags)
			profile.property_df = df
		
		# ROI calculation if requested
		if "roi_calc" in tags or "roi" in tags:
			df = profile.compute_roi(tags)
			profile.property_df = df
	
	# Standalone analysis methods (can run independently)
	if "ppsf_analysis" in tags or "price_per_sqft" in tags:
		df = profile.compute_ppsf_estimate(tags)
		profile.property_df = df
	
	if "comp_analysis" in tags or "comps" in tags:
		df = profile.compute_comps_estimate(tags)
		profile.property_df = df
	
	if "arp_estimate" in tags or "arp" in tags:
		# Only compute if not already computed above
		if "arp" not in df.columns:
			df = profile.compute_arp(tags)
			profile.property_df = df
	
	if "renovation_cost" in tags:
		# Only compute if not already computed above
		if "renovation_cost" not in df.columns:
			df = profile.compute_renovation_cost(tags)
			profile.property_df = df
	
	if "roi_calc" in tags or "roi" in tags:
		# Only compute if not already computed above
		if "roi" not in df.columns:
			df = profile.compute_roi(tags)
			profile.property_df = df
	
	return df


# Example usage:
if __name__ == "__main__":
	# Create sample property DataFrame
	sample_data = {
		"listingId": ["MLS001", "MLS002", "MLS003"],
		"price": [200000, 300000, 250000],
		"squareFeet": [1500, 2000, 1800],
		"bedrooms": [3, 4, 3],
		"bathrooms": [2, 3, 2],
		"city": ["Los Angeles", "Miami", "Austin"],
		"state": ["CA", "FL", "TX"],
		"zip": ["90024", "33139", "78746"],
		"status": ["Active", "Active", "Pending"],
	}
	df = pd.DataFrame(sample_data)
	
	# Example 1: 70% method with realtor commission
	tags_1 = ["repairing_properties", "70_percent_method", "buying_from_realtor", "arp_estimate"]
	config_1 = {"realtor_commission": 0.03, "arp_weight_ppsf": 0.6, "arp_weight_comps": 0.4}
	result_1 = run_fix_and_flip_analysis(df.copy(), tags_1, config_1)
	print("Example 1 - 70% Method with Realtor:")
	print(result_1[["listingId", "price", "arp", "renovation_cost", "max_offer_70_percent", "realtor_commission_cost"]].head())
	print()
	
	# Example 2: Standalone comp analysis
	tags_2 = ["comp_analysis", "same_zip_only"]
	result_2 = run_fix_and_flip_analysis(df.copy(), tags_2)
	print("Example 2 - Comp Analysis:")
	print(result_2[["listingId", "price", "comps_estimate", "num_comps"]].head())
	print()
	
	# Example 3: Full ROI analysis
	tags_3 = ["arp_estimate", "renovation_cost", "roi_calc", "include_permit_costs"]
	config_3 = {"arp_weight_ppsf": 0.5, "arp_weight_comps": 0.5}
	result_3 = run_fix_and_flip_analysis(df.copy(), tags_3, config_3)
	print("Example 3 - ROI Analysis:")
	print(result_3[["listingId", "price", "arp", "total_investment", "profit", "roi"]].head())