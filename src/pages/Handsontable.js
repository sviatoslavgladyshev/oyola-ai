import React, { useRef, useState } from 'react';
import { HotTable } from '@handsontable/react-wrapper';
import {
  HiPlus,
  HiTrash,
  HiDownload,
  HiUpload,
  HiRefresh,
  HiSearch,
  HiArrowLeft,
  HiArrowRight,
  HiX,
  HiMinus,
  HiClipboard,
  HiClipboardCopy
} from 'react-icons/hi';

const HandsontablePage = () => {
  const hotTableComponent = useRef(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectionRef, setSelectionRef] = useState(null);
  const [activeFormatting, setActiveFormatting] = useState({
    bold: false,
    italic: false,
    underline: false,
    fontSize: '14',
    color: '#000000',
    backgroundColor: '#ffffff',
    textAlign: 'left'
  });
  const [contextMenu, setContextMenu] = useState({ show: false, x: 0, y: 0 });
  const [activeMenu, setActiveMenu] = useState(null);
  const [formulaData, setFormulaData] = useState({}); // Store formula expressions
  const [selectedCell, setSelectedCell] = useState(null); // Track selected cell for formula bar
  const [formulaBarValue, setFormulaBarValue] = useState(''); // Formula bar input value
  const [copiedCells, setCopiedCells] = useState([]); // Track copied cells for formula adjustment during paste
  const [dependencyGraph, setDependencyGraph] = useState({}); // Track which cells depend on which others
  // Initialize with minimal data - let it grow infinitely like Excel
  const data = [
    ['', 'Ford', 'Volvo', 'Toyota', 'Honda'],
    ['2016', 10, 11, 12, 13],
    ['2017', 20, 21, 22, 23],
    ['2018', 30, 31, 32, 33],
    ['2019', 40, 41, 42, 43],
    ['2020', 50, 51, 52, 53],
  ];

  const getHotInstance = () => {
    return hotTableComponent.current?.hotInstance;
  };

  const handleAddRow = () => {
    const hot = getHotInstance();
    if (hot) {
      const rowCount = hot.countRows();
      hot.alter('insert_row', rowCount);
    }
  };

  const handleDeleteRow = () => {
    const hot = getHotInstance();
    if (hot) {
      const selected = hot.getSelected();
      if (selected && selected.length > 0) {
        const rows = [...new Set(selected.map(range => range[0]))].sort((a, b) => b - a);
        rows.forEach(row => hot.alter('remove_row', row));
      }
    }
  };

  const handleAddColumn = () => {
    const hot = getHotInstance();
    if (hot) {
      const colCount = hot.countCols();
      hot.alter('insert_col', colCount);
    }
  };

  const handleDeleteColumn = () => {
    const hot = getHotInstance();
    if (hot) {
      const selected = hot.getSelected();
      if (selected && selected.length > 0) {
        const cols = [...new Set(selected.map(range => range[1]))].sort((a, b) => b - a);
        cols.forEach(col => hot.alter('remove_col', col));
      }
    }
  };

  const handleExportCSV = () => {
    const hot = getHotInstance();
    if (hot) {
      const csv = hot.getPlugin('exportFile').exportAsString('csv', {
        bom: false,
        columnDelimiter: ',',
        columnHeaders: true,
        exportHiddenColumns: true,
        exportHiddenRows: true,
        fileExtension: 'csv',
        filename: 'handsontable-data_[YYYY]-[MM]-[DD]',
        mimeType: 'text/csv',
        rowDelimiter: '\r\n',
        rowHeaders: true
      });
      
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `handsontable-data-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleImportCSV = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const text = event.target.result;
          const hot = getHotInstance();
          if (hot) {
            const plugin = hot.getPlugin('importFile');
            plugin.importFileAsString(text, 'csv', true);
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  const handleClearData = () => {
    if (window.confirm('Are you sure you want to clear all data? This action cannot be undone.')) {
      const hot = getHotInstance();
      if (hot) {
        hot.clear();
      }
    }
  };

  const handleUndo = () => {
    const hot = getHotInstance();
    if (hot) {
      const undo = hot.getPlugin('undoRedo');
      undo.undo();
    }
  };

  const handleRedo = () => {
    const hot = getHotInstance();
    if (hot) {
      const undo = hot.getPlugin('undoRedo');
      undo.redo();
    }
  };

  const handleSearch = () => {
    const hot = getHotInstance();
    if (hot && searchQuery) {
      const searchResult = hot.search.query(searchQuery);
      if (searchResult && searchResult.length > 0) {
        hot.selectCell(searchResult[0].row, searchResult[0].col);
      }
    }
  };

  /**
   * EXCEL FORMULA SYSTEM EXPLANATION
   * 
   * Excel formulas work by:
   * 1. Starting with "=" to indicate a formula
   * 2. Using cell references (A1, B2) or absolute references ($A$1)
   * 3. Supporting arithmetic operators (+, -, *, /, ^)
   * 4. Using functions like SUM, AVERAGE, IF, VLOOKUP, CONCATENATE, MIN, MAX, COUNT, ROUND, LEN, TRIM, UPPER, LOWER
   * 5. Automatically recalculating when referenced cells change
   * 6. Detecting circular references (#CIRCULAR!)
   * 
   * CELL REFERENCE TYPES:
   * - Relative (A1): Changes when copied (A1 -> B1 when moved right)
   * - Absolute ($A$1): Never changes when copied
   * - Mixed ($A1 or A$1): Column or row is fixed, other changes
   * 
   * COMMON FUNCTIONS:
   * - SUM(range): Adds values in range
   * - AVERAGE(range): Calculates average
   * - IF(condition, true_value, false_value): Conditional logic
   * - VLOOKUP(value, table, col_index, [range_lookup]): Look up value in table
   * - CONCATENATE(text1, text2, ...): Joins text strings
   */

  // Formula parsing and calculation functions
  const formatCellReference = (row, col, isAbsoluteRow = false, isAbsoluteCol = false) => {
    // Convert row/col numbers back to Excel-style cell reference (e.g., 0,0 -> A1, $A$1, $A1, A$1)
    let colLetter = '';
    let colNum = col + 1;
    while (colNum > 0) {
      colNum--;
      colLetter = String.fromCharCode(65 + (colNum % 26)) + colLetter;
      colNum = Math.floor(colNum / 26);
    }

    const colPart = isAbsoluteCol ? `$${colLetter}` : colLetter;
    const rowPart = isAbsoluteRow ? `$${row + 1}` : `${row + 1}`;

    return `${colPart}${rowPart}`;
  };

  const parseCellReference = (ref, formulaRow = null, formulaCol = null) => {
    // Parse references like A1, $A$1, $A1, A$1 (supports absolute, relative, and mixed)
    // formulaRow/formulaCol specify where the formula containing this reference is located

    // Check for absolute reference indicators ($)
    const hasDollarCol = ref.startsWith('$');
    const hasDollarRow = ref.includes('$') && !ref.startsWith('$');
    const fullAbsolute = ref.startsWith('$') && ref.match(/\$\d+$/);

    // Remove $ symbols for parsing
    const cleanRef = ref.replace(/\$/g, '');
    const match = cleanRef.match(/([A-Z]+)(\d+)/);
    if (!match) return null;

    const colLetters = match[1];
    let row = parseInt(match[2]) - 1;
    let col = 0;

    // Convert column letters to number
    for (let i = 0; i < colLetters.length; i++) {
      col = col * 26 + (colLetters.charCodeAt(i) - 64);
    }
    col -= 1;

    // For relative references, no adjustment needed here - the reference is stored as-is
    // Adjustment happens during formula evaluation based on the current formula location

    return {
      row,
      col,
      isAbsoluteCol: hasDollarCol || fullAbsolute,
      isAbsoluteRow: fullAbsolute || hasDollarRow
    };
  };

  const detectCircularReferences = (graph) => {
    // Detect circular references in the dependency graph
    const circularCells = new Set();

    const visit = (cellKey, visiting) => {
      if (circularCells.has(cellKey)) return true; // Already detected as circular
      if (visiting.has(cellKey)) {
        circularCells.add(cellKey);
        return true; // Found a cycle
      }

      if (!graph[cellKey]) return false;

      visiting.add(cellKey);
      for (const dependency of graph[cellKey]) {
        if (visit(dependency, visiting)) {
          circularCells.add(cellKey);
          return true;
        }
      }
      visiting.delete(cellKey);
      return false;
    };

    // Check all cells for circular references
    Object.keys(graph).forEach(cellKey => {
      visit(cellKey, new Set());
    });

    return circularCells;
  };

  const buildDependencyGraph = (formulas) => {
    // Build a graph where each key is a cell that has dependencies, and the value is a set of cells it depends on
    const graph = {};

    Object.entries(formulas).forEach(([cellKey, formula]) => {
      if (!formula || typeof formula !== 'string' || !formula.startsWith('=')) return;

      const dependencies = new Set();
      // Match both single cell references and ranges
      const refRegex = /(\$?[A-Z]+\$?\d+(?::\$?[A-Z]+\$?\d+)?)/g;
      const matches = formula.match(refRegex);

      if (matches) {
        matches.forEach(ref => {
          if (ref.includes(':')) {
            // Handle ranges - add all cells in the range as dependencies
            const parsedRange = parseRange(ref);
            if (parsedRange) {
              for (let row = parsedRange.startRow; row <= parsedRange.endRow; row++) {
                for (let col = parsedRange.startCol; col <= parsedRange.endCol; col++) {
                  dependencies.add(`${row}-${col}`);
                }
              }
            }
          } else {
            // Handle single cell references
            const parsed = parseCellReference(ref);
            if (parsed) {
              dependencies.add(`${parsed.row}-${parsed.col}`);
            }
          }
        });
      }

      if (dependencies.size > 0) {
        graph[cellKey] = dependencies;
      }
    });

    return graph;
  };

  const getDependentCells = (cellKey, graph) => {
    // Get all cells that depend on the given cell (directly or indirectly)
    const visited = new Set();
    const toVisit = [cellKey];
    const dependents = new Set();

    while (toVisit.length > 0) {
      const current = toVisit.pop();
      if (visited.has(current)) continue;
      visited.add(current);

      // Find all cells that depend on current
      Object.entries(graph).forEach(([dependent, dependencies]) => {
        if (dependencies.has(current) && !dependents.has(dependent)) {
          dependents.add(dependent);
          toVisit.push(dependent);
        }
      });
    }

    return dependents;
  };

  const adjustFormulaForCopy = (formula, srcRow, srcCol, destRow, destCol) => {
    // Adjust relative references in a formula when copying from (srcRow, srcCol) to (destRow, destCol)
    // This mimics Excel's behavior where relative references adjust based on the copy offset

    const rowOffset = destRow - srcRow;
    const colOffset = destCol - srcCol;

    // Find all cell references and ranges in the formula
    // Match both single cell references and ranges (A1:B5, $A$1:$B$5, etc.)
    const refRegex = /(\$?[A-Z]+\$?\d+(?::\$?[A-Z]+\$?\d+)?)/g;
    const matches = formula.match(refRegex);

    if (!matches) return formula;

    let adjustedFormula = formula;

    matches.forEach(ref => {
      if (ref.includes(':')) {
        // Handle ranges like A1:B5
        const [startRef, endRef] = ref.split(':');
        const startParsed = parseCellReference(startRef);
        const endParsed = parseCellReference(endRef);

        if (startParsed && endParsed) {
          // Adjust start reference
          let newStartRow = startParsed.row;
          let newStartCol = startParsed.col;
          if (!startParsed.isAbsoluteRow) newStartRow += rowOffset;
          if (!startParsed.isAbsoluteCol) newStartCol += colOffset;

          // Adjust end reference
          let newEndRow = endParsed.row;
          let newEndCol = endParsed.col;
          if (!endParsed.isAbsoluteRow) newEndRow += rowOffset;
          if (!endParsed.isAbsoluteCol) newEndCol += colOffset;

          const newStartRef = formatCellReference(newStartRow, newStartCol, startParsed.isAbsoluteRow, startParsed.isAbsoluteCol);
          const newEndRef = formatCellReference(newEndRow, newEndCol, endParsed.isAbsoluteRow, endParsed.isAbsoluteCol);
          const newRangeRef = `${newStartRef}:${newEndRef}`;

          // Replace in formula
          const escapedRef = ref.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          adjustedFormula = adjustedFormula.replace(new RegExp(escapedRef, 'g'), newRangeRef);
        }
      } else {
        // Handle single cell references
        const parsed = parseCellReference(ref);
        if (!parsed) return;

        // Only adjust relative references (not absolute ones)
        let newRow = parsed.row;
        let newCol = parsed.col;

        if (!parsed.isAbsoluteRow) {
          newRow += rowOffset;
        }
        if (!parsed.isAbsoluteCol) {
          newCol += colOffset;
        }

        // Convert back to cell reference format
        const newRef = formatCellReference(newRow, newCol, parsed.isAbsoluteRow, parsed.isAbsoluteCol);

        // Replace in formula
        const escapedRef = ref.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        adjustedFormula = adjustedFormula.replace(new RegExp(escapedRef, 'g'), newRef);
      }
    });

    return adjustedFormula;
  };

  const parseRange = (range, currentRow = null, currentCol = null) => {
    // Parse ranges like A1:B5, $A$1:$B$5, etc.
    const [start, end] = range.split(':');
    const startRef = parseCellReference(start.trim(), currentRow, currentCol);
    const endRef = parseCellReference(end.trim(), currentRow, currentCol);
    if (!startRef || !endRef) return null;

    return {
      startRow: Math.min(startRef.row, endRef.row),
      endRow: Math.max(startRef.row, endRef.row),
      startCol: Math.min(startRef.col, endRef.col),
      endCol: Math.max(startRef.col, endRef.col)
    };
  };

  const getCellValue = (row, col) => {
    const hot = getHotInstance();
    if (!hot) return 0;
    
    const value = hot.getDataAtCell(row, col);
    if (value === null || value === undefined || value === '') return 0;
    
    // If it's a formula, calculate it
    const cellKey = `${row}-${col}`;
    if (formulaData[cellKey]) {
      return calculateFormula(formulaData[cellKey], row, col);
    }
    
    const numValue = parseFloat(value);
    return isNaN(numValue) ? 0 : numValue;
  };

  const getCellValueRaw = (row, col) => {
    // Get raw cell value (not calculated, useful for text)
    const hot = getHotInstance();
    if (!hot) return '';
    return hot.getDataAtCell(row, col) || '';
  };

  const evaluateExpression = (expr) => {
    // Safely evaluate mathematical expressions with proper operator precedence
    try {
      // Replace any remaining cell references if any
      const cellRefRegex = /(\$?[A-Z]+\$?\d+)/g;
      let exprWithValues = expr;
      const matches = expr.match(cellRefRegex);
      if (matches) {
        matches.forEach(ref => {
          const parsed = parseCellReference(ref);
          if (parsed) {
            const value = getCellValue(parsed.row, parsed.col);
            // Escape special regex characters in the original ref
            const escapedRef = ref.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            exprWithValues = exprWithValues.replace(new RegExp(escapedRef, 'g'), value);
          }
        });
      }

      // Use a safer evaluation approach by creating a function with limited scope
      // This prevents access to dangerous globals while still allowing math operations
      const safeEval = (expression) => {
        // Only allow safe mathematical operations and constants
        const safeContext = {
          Math: Math,
          parseFloat: parseFloat,
          parseInt: parseInt,
          isNaN: isNaN,
          isFinite: isFinite,
          abs: Math.abs,
          ceil: Math.ceil,
          floor: Math.floor,
          round: Math.round,
          max: Math.max,
          min: Math.min,
          pow: Math.pow,
          sqrt: Math.sqrt,
          sin: Math.sin,
          cos: Math.cos,
          tan: Math.tan,
          PI: Math.PI,
          E: Math.E
        };

        // Create a function with restricted context
        // eslint-disable-next-line no-new-func
        const func = new Function(...Object.keys(safeContext), `return (${expression});`);
        return func(...Object.values(safeContext));
      };

      const result = safeEval(exprWithValues);
      return typeof result === 'number' && !isNaN(result) && isFinite(result) ? result : '#ERROR!';
    } catch (e) {
      return '#ERROR!';
    }
  };

  const calculateFormula = (formula, currentRow, currentCol) => {
    const hot = getHotInstance();
    if (!hot) return 0;

    // Check for circular references
    const cellKey = `${currentRow}-${currentCol}`;
    const circularCells = detectCircularReferences(dependencyGraph);
    if (circularCells.has(cellKey)) {
      return '#CIRCULAR!';
    }

    // Remove leading = if present
    formula = formula.trim().replace(/^=/, '');

    // Helper to parse function arguments
    const parseFunctionArgs = (funcName, formula) => {
      const funcRegex = new RegExp(`${funcName}\\(([^)]+)\\)`, 'i');
      const match = formula.match(funcRegex);
      if (!match) return null;
      
      // Split arguments by comma, handling nested parentheses
      const argsStr = match[1];
      const args = [];
      let currentArg = '';
      let depth = 0;
      
      for (let i = 0; i < argsStr.length; i++) {
        const char = argsStr[i];
        if (char === '(') depth++;
        else if (char === ')') depth--;
        else if (char === ',' && depth === 0) {
          args.push(currentArg.trim());
          currentArg = '';
          continue;
        }
        currentArg += char;
      }
      if (currentArg) args.push(currentArg.trim());
      
      return args;
    };
    
    // Handle SUM function: =SUM(A1:A10) or =SUM(A1,B2,C3)
    if (formula.match(/^SUM\(/i)) {
      const args = parseFunctionArgs('SUM', formula);
      if (!args) return '#ERROR!';
      
      let sum = 0;
      args.forEach(arg => {
        // Check if it's a range
        if (arg.includes(':')) {
          const parsedRange = parseRange(arg, currentRow, currentCol);
          if (parsedRange) {
            for (let row = parsedRange.startRow; row <= parsedRange.endRow; row++) {
              for (let col = parsedRange.startCol; col <= parsedRange.endCol; col++) {
                sum += getCellValue(row, col);
              }
            }
          }
        } else {
          // Single cell reference or number
          const parsed = parseCellReference(arg, currentRow, currentCol);
          if (parsed) {
            sum += getCellValue(parsed.row, parsed.col);
          } else {
            const num = parseFloat(arg);
            if (!isNaN(num)) sum += num;
          }
        }
      });
      return sum;
    }
    
    // Handle AVERAGE function
    if (formula.match(/^AVERAGE\(/i)) {
      const args = parseFunctionArgs('AVERAGE', formula);
      if (!args) return '#ERROR!';
      
      let sum = 0;
      let count = 0;
      args.forEach(arg => {
        if (arg.includes(':')) {
          const parsedRange = parseRange(arg, currentRow, currentCol);
          if (parsedRange) {
            for (let row = parsedRange.startRow; row <= parsedRange.endRow; row++) {
              for (let col = parsedRange.startCol; col <= parsedRange.endCol; col++) {
                sum += getCellValue(row, col);
                count++;
              }
            }
          }
        } else {
          const parsed = parseCellReference(arg, currentRow, currentCol);
          if (parsed) {
            sum += getCellValue(parsed.row, parsed.col);
            count++;
          } else {
            const num = parseFloat(arg);
            if (!isNaN(num)) {
              sum += num;
              count++;
            }
          }
        }
      });
      return count > 0 ? sum / count : 0;
    }
    
    // Handle IF function: =IF(condition, true_value, false_value)
    if (formula.match(/^IF\(/i)) {
      const args = parseFunctionArgs('IF', formula);
      if (!args || args.length < 3) return '#ERROR!';
      
      const condition = args[0].trim();
      const trueValue = args[1].trim();
      const falseValue = args[2].trim();
      
      // Evaluate condition - support simple comparisons and cell references
      let conditionResult = false;
      
      // Check for comparison operators
      if (condition.includes('>=')) {
        const [left, right] = condition.split('>=').map(s => s.trim());
        const leftVal = parseCellReference(left) ? getCellValue(...Object.values(parseCellReference(left))) : parseFloat(left);
        const rightVal = parseCellReference(right) ? getCellValue(...Object.values(parseCellReference(right))) : parseFloat(right);
        conditionResult = leftVal >= rightVal;
      } else if (condition.includes('<=')) {
        const [left, right] = condition.split('<=').map(s => s.trim());
        const leftVal = parseCellReference(left) ? getCellValue(...Object.values(parseCellReference(left))) : parseFloat(left);
        const rightVal = parseCellReference(right) ? getCellValue(...Object.values(parseCellReference(right))) : parseFloat(right);
        conditionResult = leftVal <= rightVal;
      } else if (condition.includes('<>') || condition.includes('!=')) {
        const [left, right] = condition.split(/[<>!]=?/).map(s => s.trim());
        const leftVal = parseCellReference(left) ? getCellValue(...Object.values(parseCellReference(left))) : (isNaN(parseFloat(left)) ? left : parseFloat(left));
        const rightVal = parseCellReference(right) ? getCellValue(...Object.values(parseCellReference(right))) : (isNaN(parseFloat(right)) ? right : parseFloat(right));
        conditionResult = leftVal !== rightVal;
      } else if (condition.includes('=')) {
        const [left, right] = condition.split('=').map(s => s.trim());
        const leftVal = parseCellReference(left) ? getCellValue(...Object.values(parseCellReference(left))) : (isNaN(parseFloat(left)) ? left : parseFloat(left));
        const rightVal = parseCellReference(right) ? getCellValue(...Object.values(parseCellReference(right))) : (isNaN(parseFloat(right)) ? right : parseFloat(right));
        conditionResult = leftVal === rightVal;
      } else if (condition.includes('>')) {
        const [left, right] = condition.split('>').map(s => s.trim());
        const leftVal = parseCellReference(left) ? getCellValue(...Object.values(parseCellReference(left))) : parseFloat(left);
        const rightVal = parseCellReference(right) ? getCellValue(...Object.values(parseCellReference(right))) : parseFloat(right);
        conditionResult = leftVal > rightVal;
      } else if (condition.includes('<')) {
        const [left, right] = condition.split('<').map(s => s.trim());
        const leftVal = parseCellReference(left) ? getCellValue(...Object.values(parseCellReference(left))) : parseFloat(left);
        const rightVal = parseCellReference(right) ? getCellValue(...Object.values(parseCellReference(right))) : parseFloat(right);
        conditionResult = leftVal < rightVal;
      } else {
        // Try to evaluate as boolean expression
        try {
          conditionResult = evaluateExpression(condition);
          conditionResult = Boolean(conditionResult);
        } catch (e) {
          return '#ERROR!';
        }
      }
      
      // Return appropriate value based on condition
      const resultValue = conditionResult ? trueValue : falseValue;
      
      // If result is a cell reference, get its value
      const resultParsed = parseCellReference(resultValue, currentRow, currentCol);
      if (resultParsed) {
        return getCellValue(resultParsed.row, resultParsed.col);
      }
      
      // If result is a number, return it
      const numResult = parseFloat(resultValue);
      if (!isNaN(numResult)) {
        return numResult;
      }
      
      // Otherwise return as string (remove quotes if present)
      return resultValue.replace(/^["']|["']$/g, '');
    }
    
    // Handle VLOOKUP function: =VLOOKUP(lookup_value, table_array, col_index_num, [range_lookup])
    if (formula.match(/^VLOOKUP\(/i)) {
      const args = parseFunctionArgs('VLOOKUP', formula);
      if (!args || args.length < 3) return '#ERROR!';
      
      const lookupValue = args[0].trim();
      const tableRange = args[1].trim();
      const colIndex = parseInt(args[2].trim()) - 1; // Excel is 1-indexed, we're 0-indexed
      const rangeLookup = args.length > 3 ? args[3].trim().toLowerCase() !== 'false' : true;
      
      // Parse lookup value
      let lookupVal = null;
      const lookupParsed = parseCellReference(lookupValue, currentRow, currentCol);
      if (lookupParsed) {
        lookupVal = getCellValueRaw(lookupParsed.row, lookupParsed.col);
      } else {
        lookupVal = isNaN(parseFloat(lookupValue)) ? lookupValue.replace(/^["']|["']$/g, '') : parseFloat(lookupValue);
      }
      
      // Parse table range
      const parsedRange = parseRange(tableRange, currentRow, currentCol);
      if (!parsedRange) return '#ERROR!';
      
      // Search for lookup value in first column of range
      for (let row = parsedRange.startRow; row <= parsedRange.endRow; row++) {
        const firstColVal = getCellValueRaw(row, parsedRange.startCol);
        const match = rangeLookup ?
          (firstColVal === lookupVal || (typeof firstColVal === 'number' && typeof lookupVal === 'number' && Math.abs(firstColVal - lookupVal) < 0.0001)) :
          (firstColVal === lookupVal);
        
        if (match) {
          // Found match, return value from specified column
          const resultCol = parsedRange.startCol + colIndex;
          if (resultCol <= parsedRange.endCol && resultCol >= 0) {
            return getCellValueRaw(row, resultCol);
          }
        }
      }
      
      return '#N/A';
    }
    
    // Handle CONCATENATE function: =CONCATENATE(text1, text2, ...)
    if (formula.match(/^CONCATENATE\(/i)) {
      const args = parseFunctionArgs('CONCATENATE', formula);
      if (!args) return '#ERROR!';
      
      let result = '';
      args.forEach(arg => {
        const parsed = parseCellReference(arg.trim(), currentRow, currentCol);
        if (parsed) {
          result += String(getCellValueRaw(parsed.row, parsed.col));
        } else {
          // Remove quotes if present
          result += arg.replace(/^["']|["']$/g, '');
        }
      });
      return result;
    }
    
    // Handle MIN function
    if (formula.match(/^MIN\(/i)) {
      const args = parseFunctionArgs('MIN', formula);
      if (!args) return '#ERROR!';
      
      let min = Infinity;
      args.forEach(arg => {
        if (arg.includes(':')) {
          const parsedRange = parseRange(arg, currentRow, currentCol);
          if (parsedRange) {
            for (let row = parsedRange.startRow; row <= parsedRange.endRow; row++) {
              for (let col = parsedRange.startCol; col <= parsedRange.endCol; col++) {
                const val = getCellValue(row, col);
                if (val < min) min = val;
              }
            }
          }
        } else {
          const parsed = parseCellReference(arg, currentRow, currentCol);
          if (parsed) {
            const val = getCellValue(parsed.row, parsed.col);
            if (val < min) min = val;
          } else {
            const num = parseFloat(arg);
            if (!isNaN(num) && num < min) min = num;
          }
        }
      });
      return min === Infinity ? 0 : min;
    }
    
    // Handle MAX function
    if (formula.match(/^MAX\(/i)) {
      const args = parseFunctionArgs('MAX', formula);
      if (!args) return '#ERROR!';
      
      let max = -Infinity;
      args.forEach(arg => {
        if (arg.includes(':')) {
          const parsedRange = parseRange(arg, currentRow, currentCol);
          if (parsedRange) {
            for (let row = parsedRange.startRow; row <= parsedRange.endRow; row++) {
              for (let col = parsedRange.startCol; col <= parsedRange.endCol; col++) {
                const val = getCellValue(row, col);
                if (val > max) max = val;
              }
            }
          }
        } else {
          const parsed = parseCellReference(arg, currentRow, currentCol);
          if (parsed) {
            const val = getCellValue(parsed.row, parsed.col);
            if (val > max) max = val;
          } else {
            const num = parseFloat(arg);
            if (!isNaN(num) && num > max) max = num;
          }
        }
      });
      return max === -Infinity ? 0 : max;
    }
    
    // Handle COUNT function
    if (formula.match(/^COUNT\(/i)) {
      const args = parseFunctionArgs('COUNT', formula);
      if (!args) return '#ERROR!';

      let count = 0;
      args.forEach(arg => {
        if (arg.includes(':')) {
          const parsedRange = parseRange(arg, currentRow, currentCol);
          if (parsedRange) {
            for (let row = parsedRange.startRow; row <= parsedRange.endRow; row++) {
              for (let col = parsedRange.startCol; col <= parsedRange.endCol; col++) {
                const val = hot.getDataAtCell(row, col);
                if (val !== null && val !== undefined && val !== '') {
                  count++;
                }
              }
            }
          }
        } else {
          const parsed = parseCellReference(arg, currentRow, currentCol);
          if (parsed) {
            const val = hot.getDataAtCell(parsed.row, parsed.col);
            if (val !== null && val !== undefined && val !== '') {
              count++;
            }
          }
        }
      });
      return count;
    }

    // Handle ROUND function: =ROUND(number, num_digits)
    if (formula.match(/^ROUND\(/i)) {
      const args = parseFunctionArgs('ROUND', formula);
      if (!args || args.length < 1) return '#ERROR!';

      const number = args[0].trim();
      const digits = args.length > 1 ? parseInt(args[1].trim()) : 0;

      let numValue = null;
      const parsed = parseCellReference(number, currentRow, currentCol);
      if (parsed) {
        numValue = getCellValue(parsed.row, parsed.col);
      } else {
        numValue = parseFloat(number);
      }

      if (isNaN(numValue)) return '#ERROR!';
      return Math.round(numValue * Math.pow(10, digits)) / Math.pow(10, digits);
    }

    // Handle LEN function: =LEN(text)
    if (formula.match(/^LEN\(/i)) {
      const args = parseFunctionArgs('LEN', formula);
      if (!args || args.length < 1) return '#ERROR!';

      const text = args[0].trim();
      let textValue = '';
      const parsed = parseCellReference(text, currentRow, currentCol);
      if (parsed) {
        textValue = String(getCellValueRaw(parsed.row, parsed.col));
      } else {
        textValue = text.replace(/^["']|["']$/g, '');
      }

      return textValue.length;
    }

    // Handle TRIM function: =TRIM(text)
    if (formula.match(/^TRIM\(/i)) {
      const args = parseFunctionArgs('TRIM', formula);
      if (!args || args.length < 1) return '#ERROR!';

      const text = args[0].trim();
      let textValue = '';
      const parsed = parseCellReference(text, currentRow, currentCol);
      if (parsed) {
        textValue = String(getCellValueRaw(parsed.row, parsed.col));
      } else {
        textValue = text.replace(/^["']|["']$/g, '');
      }

      return textValue.trim();
    }

    // Handle UPPER function: =UPPER(text)
    if (formula.match(/^UPPER\(/i)) {
      const args = parseFunctionArgs('UPPER', formula);
      if (!args || args.length < 1) return '#ERROR!';

      const text = args[0].trim();
      let textValue = '';
      const parsed = parseCellReference(text, currentRow, currentCol);
      if (parsed) {
        textValue = String(getCellValueRaw(parsed.row, parsed.col));
      } else {
        textValue = text.replace(/^["']|["']$/g, '');
      }

      return textValue.toUpperCase();
    }

    // Handle LOWER function: =LOWER(text)
    if (formula.match(/^LOWER\(/i)) {
      const args = parseFunctionArgs('LOWER', formula);
      if (!args || args.length < 1) return '#ERROR!';

      const text = args[0].trim();
      let textValue = '';
      const parsed = parseCellReference(text, currentRow, currentCol);
      if (parsed) {
        textValue = String(getCellValueRaw(parsed.row, parsed.col));
      } else {
        textValue = text.replace(/^["']|["']$/g, '');
      }

      return textValue.toLowerCase();
    }
    
    // Handle simple arithmetic (e.g., =A1+B2, =A1*2, =($A$1+B2)/2, etc.)
    // Support absolute, relative, and mixed references
    const cellRefRegex = /(\$?[A-Z]+\$?\d+)/g;
    let formulaWithValues = formula;
    const matches = formula.match(cellRefRegex);
    if (matches) {
      matches.forEach(ref => {
        const parsed = parseCellReference(ref, currentRow, currentCol);
        if (parsed) {
          const value = getCellValue(parsed.row, parsed.col);
          // Escape special regex characters
          const escapedRef = ref.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          formulaWithValues = formulaWithValues.replace(new RegExp(escapedRef, 'g'), value);
        }
      });
      
      return evaluateExpression(formulaWithValues);
    }
    
    return '#ERROR!';
  };

  // Formatting functions - apply styles to selected cells
  const applyFormatToSelection = (styleUpdates) => {
    const hot = getHotInstance();
    if (!hot) return;
    
    // Try to get selection from multiple sources
    let selected = null;
    
    // First, try stored selection ref
    if (selectionRef && selectionRef.length > 0) {
      selected = selectionRef;
    }
    
    // If no stored selection, try current selection
    if (!selected || selected.length === 0) {
      selected = hot.getSelected();
    }
    
    // If still no selection, try getting from last known selection
    if (!selected || selected.length === 0) {
      const lastSelection = hot.view?.wt?.wtTable?.selectedCell || null;
      if (lastSelection) {
        const row = hot.propToRow(lastSelection.row);
        const col = hot.propToCol(lastSelection.col);
        selected = [[row, col, row, col]];
      }
    }
    
    if (!selected || selected.length === 0) {
      console.warn('No selection found');
      return;
    }
    
    // Apply formatting to all selected cells
    const cellsToFormat = [];
    selected.forEach(([startRow, startCol, endRow, endCol]) => {
      for (let row = Math.min(startRow, endRow); row <= Math.max(startRow, endRow); row++) {
        for (let col = Math.min(startCol, endCol); col <= Math.max(startCol, endCol); col++) {
          cellsToFormat.push([row, col]);
        }
      }
    });
    
    // Apply formatting to each cell
    cellsToFormat.forEach(([row, col]) => {
      // Get current cell meta and formatting
      const currentMeta = hot.getCellMeta(row, col);
      const currentFormatting = currentMeta.formatting || {};
      
      // Merge new formatting with existing
      const newFormatting = { ...currentFormatting, ...styleUpdates };
      
      // Store formatting in cell meta
      hot.setCellMeta(row, col, 'formatting', newFormatting);
      
      // Create/update renderer that applies formatting
      hot.setCellMeta(row, col, 'renderer', function(instance, td, row, col, prop, value, cellProperties) {
        // Get the Handsontable instance
        const Handsontable = instance.constructor || window.Handsontable;
        
        // Try to get default text renderer
        let defaultRenderer = null;
        if (Handsontable && Handsontable.renderers) {
          defaultRenderer = Handsontable.renderers.getRenderer('text') || 
                           Handsontable.renderers.TextRenderer ||
                           Handsontable.renderers.textRenderer;
        }
        
        // Apply default renderer or fallback
        if (defaultRenderer && typeof defaultRenderer === 'function') {
          try {
            defaultRenderer.apply(this, arguments);
          } catch (e) {
            // Fallback if renderer fails
            td.innerHTML = value !== null && value !== undefined ? String(value) : '';
          }
        } else {
          // Fallback if no renderer available
          td.innerHTML = value !== null && value !== undefined ? String(value) : '';
        }
        
        // Apply formatting from cell meta
        const formatting = cellProperties.formatting || {};
        
        if (formatting.fontWeight) td.style.fontWeight = formatting.fontWeight;
        else if (formatting.fontWeight === 'normal') td.style.fontWeight = 'normal';
        
        if (formatting.fontStyle) td.style.fontStyle = formatting.fontStyle;
        else if (formatting.fontStyle === 'normal') td.style.fontStyle = 'normal';
        
        if (formatting.textDecoration) td.style.textDecoration = formatting.textDecoration;
        else if (formatting.textDecoration === 'none') td.style.textDecoration = 'none';
        
        if (formatting.fontSize) td.style.fontSize = formatting.fontSize;
        if (formatting.color) td.style.color = formatting.color;
        if (formatting.backgroundColor) td.style.backgroundColor = formatting.backgroundColor;
        if (formatting.textAlign) td.style.textAlign = formatting.textAlign;
      });
    });
    
    // Restore selection after formatting
    if (selected && selected.length > 0) {
      const [startRow, startCol, endRow, endCol] = selected[0];
      setTimeout(() => {
        try {
          hot.selectCell(Math.min(startRow, endRow), Math.min(startCol, endCol), Math.max(startRow, endRow), Math.max(startCol, endCol), false);
        } catch (e) {
          console.warn('Could not restore selection:', e);
        }
      }, 50);
    }
    
    // Force render
    hot.render();
  };

  const handleBold = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    const hot = getHotInstance();
    if (!hot) return;
    
    // Try to get selection before it's lost
    let selected = hot.getSelected();
    
    // If no selection, try the stored one
    if (!selected || selected.length === 0) {
      selected = selectionRef;
    }
    
    if (!selected || selected.length === 0) {
      return; // No selection to format
    }
    
    // Store selection
    setSelectionRef(selected);
    
    // Get current formatting state
    const [startRow, startCol] = selected[0];
    const cellMeta = hot.getCellMeta(startRow, startCol);
    const currentFormatting = cellMeta.formatting || {};
    const isBold = currentFormatting.fontWeight === 'bold';
    
    // Apply formatting
    applyFormatToSelection({ fontWeight: isBold ? 'normal' : 'bold' });
  };

  const handleItalic = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const hot = getHotInstance();
    if (hot) {
      const selected = hot.getSelected();
      if (selected && selected.length > 0) {
        setSelectionRef(selected);
        const [startRow, startCol] = selected[0];
        const cellMeta = hot.getCellMeta(startRow, startCol);
        const currentFormatting = cellMeta.formatting || {};
        const isItalic = currentFormatting.fontStyle === 'italic';
        applyFormatToSelection({ fontStyle: isItalic ? 'normal' : 'italic' });
      }
    }
  };

  const handleUnderline = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const hot = getHotInstance();
    if (hot) {
      const selected = hot.getSelected();
      if (selected && selected.length > 0) {
        setSelectionRef(selected);
        const [startRow, startCol] = selected[0];
        const cellMeta = hot.getCellMeta(startRow, startCol);
        const currentFormatting = cellMeta.formatting || {};
        const isUnderlined = currentFormatting.textDecoration === 'underline';
        applyFormatToSelection({ textDecoration: isUnderlined ? 'none' : 'underline' });
      }
    }
  };

  const handleFontSize = (size) => {
    const hot = getHotInstance();
    if (hot) {
      const selected = hot.getSelected();
      if (selected && selected.length > 0) {
        setSelectionRef(selected);
        applyFormatToSelection({ fontSize: `${size}px` });
      }
    }
  };

  const handleFontColor = (color) => {
    const hot = getHotInstance();
    if (hot) {
      const selected = hot.getSelected();
      if (selected && selected.length > 0) {
        setSelectionRef(selected);
        applyFormatToSelection({ color });
      }
    }
  };

  const handleBackgroundColor = (color) => {
    const hot = getHotInstance();
    if (hot) {
      const selected = hot.getSelected();
      if (selected && selected.length > 0) {
        setSelectionRef(selected);
        applyFormatToSelection({ backgroundColor: color });
      }
    }
  };

  const handleAlignment = (align) => {
    const hot = getHotInstance();
    if (hot) {
      const selected = hot.getSelected();
      if (selected && selected.length > 0) {
        setSelectionRef(selected);
        applyFormatToSelection({ textAlign: align });
      }
    }
  };

  // Context menu handlers
  const handleContextMenu = (e) => {
    e.preventDefault();
    const hot = getHotInstance();
    if (!hot) return;
    
    // Get selection at context menu location
    const selected = hot.getSelected();
    if (selected && selected.length > 0) {
      setSelectionRef(JSON.parse(JSON.stringify(selected)));
    }
    
    setContextMenu({
      show: true,
      x: e.clientX,
      y: e.clientY
    });
  };

  const closeContextMenu = () => {
    setContextMenu({ show: false, x: 0, y: 0 });
  };

  const handleCopy = () => {
    const hot = getHotInstance();
    if (hot) {
      // Store the cells being copied for formula adjustment during paste
      const selected = hot.getSelected();
      if (selected && selected.length > 0) {
        const cellsToCopy = [];
        selected.forEach(([startRow, startCol, endRow, endCol]) => {
          for (let row = Math.min(startRow, endRow); row <= Math.max(startRow, endRow); row++) {
            for (let col = Math.min(startCol, endCol); col <= Math.max(startCol, endCol); col++) {
              const cellKey = `${row}-${col}`;
              const formula = formulaData[cellKey];
              cellsToCopy.push({
                row,
                col,
                formula: formula || null,
                value: hot.getDataAtCell(row, col)
              });
            }
          }
        });
        setCopiedCells(cellsToCopy);
      }
      hot.copy();
      closeContextMenu();
    }
  };

  const handleCut = () => {
    const hot = getHotInstance();
    if (hot) {
      hot.cut();
      closeContextMenu();
    }
  };

  const handlePaste = () => {
    const hot = getHotInstance();
    if (hot) {
      hot.paste();
      closeContextMenu();
    }
  };

  const handleInsertRowAbove = () => {
    const hot = getHotInstance();
    if (hot && selectionRef && selectionRef.length > 0) {
      const [startRow] = selectionRef[0];
      hot.alter('insert_row', startRow);
      closeContextMenu();
    }
  };

  const insertFunction = (functionName) => {
    if (!selectedCell) return;

    let formulaTemplate = '';

    // Define templates for different functions
    switch (functionName.toUpperCase()) {
      case 'SUM':
        formulaTemplate = '=SUM(A1:A10)';
        break;
      case 'AVERAGE':
        formulaTemplate = '=AVERAGE(A1:A10)';
        break;
      case 'COUNT':
        formulaTemplate = '=COUNT(A1:A10)';
        break;
      case 'MIN':
        formulaTemplate = '=MIN(A1:A10)';
        break;
      case 'MAX':
        formulaTemplate = '=MAX(A1:A10)';
        break;
      case 'ROUND':
        formulaTemplate = '=ROUND(A1, 2)';
        break;
      case 'LEN':
        formulaTemplate = '=LEN(A1)';
        break;
      case 'TRIM':
        formulaTemplate = '=TRIM(A1)';
        break;
      case 'UPPER':
        formulaTemplate = '=UPPER(A1)';
        break;
      case 'LOWER':
        formulaTemplate = '=LOWER(A1)';
        break;
      case 'CONCATENATE':
        formulaTemplate = '=CONCATENATE(A1, " ", B1)';
        break;
      case 'IF':
        formulaTemplate = '=IF(A1 > 10, "High", "Low")';
        break;
      case 'VLOOKUP':
        formulaTemplate = '=VLOOKUP(A1, D1:F10, 2, FALSE)';
        break;
      default:
        formulaTemplate = `=${functionName.toUpperCase()}()`;
    }

    const hot = getHotInstance();
    if (hot) {
      // Set the formula in the selected cell
      hot.setDataAtCell(selectedCell.row, selectedCell.col, formulaTemplate);

      // Store the formula
      const cellKey = `${selectedCell.row}-${selectedCell.col}`;
      setFormulaData(prev => {
        const updated = { ...prev, [cellKey]: formulaTemplate };
        // Update dependency graph
        setDependencyGraph(buildDependencyGraph(updated));
        return updated;
      });

      // Update formula bar
      setFormulaBarValue(formulaTemplate);

      // Force render
      setTimeout(() => hot.render(), 10);
    }
  };

  const handleInsertRowBelow = () => {
    const hot = getHotInstance();
    if (hot && selectionRef && selectionRef.length > 0) {
      const [startRow, , endRow] = selectionRef[0];
      hot.alter('insert_row', Math.max(startRow, endRow) + 1);
      closeContextMenu();
    }
  };

  const handleInsertColumnLeft = () => {
    const hot = getHotInstance();
    if (hot && selectionRef && selectionRef.length > 0) {
      const [, startCol] = selectionRef[0];
      hot.alter('insert_col', startCol);
      closeContextMenu();
    }
  };

  const handleInsertColumnRight = () => {
    const hot = getHotInstance();
    if (hot && selectionRef && selectionRef.length > 0) {
      const [, startCol, , endCol] = selectionRef[0];
      hot.alter('insert_col', Math.max(startCol, endCol) + 1);
      closeContextMenu();
    }
  };

  const handleClearContents = () => {
    const hot = getHotInstance();
    if (hot && selectionRef && selectionRef.length > 0) {
      const [startRow, startCol, endRow, endCol] = selectionRef[0];
      for (let row = Math.min(startRow, endRow); row <= Math.max(startRow, endRow); row++) {
        for (let col = Math.min(startCol, endCol); col <= Math.max(startCol, endCol); col++) {
          hot.setDataAtCell(row, col, '');
        }
      }
      closeContextMenu();
    }
  };

  // Function to update active formatting based on selected cell
  const updateActiveFormatting = () => {
    const hot = getHotInstance();
    if (!hot) return;
    
    const selected = hot.getSelected();
    if (!selected || selected.length === 0) return;
    
    const [startRow, startCol] = selected[0];
    const cellMeta = hot.getCellMeta(startRow, startCol);
    const formatting = cellMeta.formatting || {};
    
    setActiveFormatting({
      bold: formatting.fontWeight === 'bold',
      italic: formatting.fontStyle === 'italic',
      underline: formatting.textDecoration === 'underline',
      fontSize: formatting.fontSize ? formatting.fontSize.replace('px', '') : '14',
      color: formatting.color || '#000000',
      backgroundColor: formatting.backgroundColor || '#ffffff',
      textAlign: formatting.textAlign || 'left'
    });
  };


  return (
    <div className="handsontable-page-container">
      <div className="handsontable-page-wrapper">
        <div className="handsontable-page-header">
          <h1 className="handsontable-page-title">Data Table</h1>
          <p className="handsontable-page-description">
            Edit, sort, filter, and manage your data in a spreadsheet-like interface.
          </p>
        </div>
        
        {/* Menu Bar */}
        <div className="handsontable-menu-bar">
          <div className="handsontable-menu-section">
            <div
              className="handsontable-menu-dropdown-container"
              onMouseEnter={() => setActiveMenu('file')}
              onMouseLeave={() => setActiveMenu(null)}
            >
              <button
                className={`handsontable-menu-button ${activeMenu === 'file' ? 'active' : ''}`}
              >
                File
              </button>
              {activeMenu === 'file' && (
                <div className="handsontable-menu-dropdown">
                  <button
                    onClick={handleImportCSV}
                    className="handsontable-menu-item"
                  >
                    <HiUpload size={18} />
                    <span>Import CSV...</span>
                  </button>
                  <button
                    onClick={handleExportCSV}
                    className="handsontable-menu-item"
                  >
                    <HiDownload size={18} />
                    <span>Export CSV...</span>
                  </button>
                  <div className="handsontable-menu-separator" />
                  <button
                    onClick={handleClearData}
                    className="handsontable-menu-item danger"
                  >
                    <HiRefresh size={18} />
                    <span>Clear All</span>
                  </button>
                </div>
              )}
            </div>
            
            <div
              className="handsontable-menu-dropdown-container"
              onMouseEnter={() => setActiveMenu('edit')}
              onMouseLeave={() => setActiveMenu(null)}
            >
              <button
                className={`handsontable-menu-button ${activeMenu === 'edit' ? 'active' : ''}`}
              >
                Edit
              </button>
              {activeMenu === 'edit' && (
                <div className="handsontable-menu-dropdown">
                  <button
                    onClick={handleUndo}
                    className="handsontable-menu-item"
                  >
                    <HiArrowLeft size={18} />
                    <span>Undo</span>
                    <span className="handsontable-menu-shortcut">Ctrl+Z</span>
                  </button>
                  <button
                    onClick={handleRedo}
                    className="handsontable-menu-item"
                  >
                    <HiArrowRight size={18} />
                    <span>Redo</span>
                    <span className="handsontable-menu-shortcut">Ctrl+Y</span>
                  </button>
                  <div className="handsontable-menu-separator" />
                  <button
                    onClick={handleAddRow}
                    className="handsontable-menu-item"
                  >
                    <HiPlus size={18} />
                    <span>Add Row</span>
                  </button>
                  <button
                    onClick={handleDeleteRow}
                    className="handsontable-menu-item"
                  >
                    <HiTrash size={18} />
                    <span>Delete Row</span>
                  </button>
                  <button
                    onClick={handleAddColumn}
                    className="handsontable-menu-item"
                  >
                    <HiPlus size={18} />
                    <span>Add Column</span>
                  </button>
                  <button
                    onClick={handleDeleteColumn}
                    className="handsontable-menu-item"
                  >
                    <HiTrash size={18} />
                    <span>Delete Column</span>
                  </button>
                </div>
              )}
            </div>
            
            <div
              className="handsontable-menu-dropdown-container"
              onMouseEnter={() => setActiveMenu('formulas')}
              onMouseLeave={(e) => {
                // Don't close if hovering over the dropdown
                if (!e.currentTarget.querySelector(':hover')) {
                  setActiveMenu(null);
                }
              }}
            >
              <button
                className={`handsontable-menu-button ${activeMenu === 'formulas' ? 'active' : ''}`}
              >
                Formulas
              </button>
              {activeMenu === 'formulas' && (
                <div
                  className="handsontable-formula-dropdown"
                  onMouseEnter={() => setActiveMenu('formulas')}
                  onMouseLeave={() => setActiveMenu(null)}
                >
                  <div className="handsontable-formula-section-label">
                    Formula Bar
                  </div>
                  <div className="handsontable-formula-bar-container">
                    <div className="handsontable-cell-reference">
                      {selectedCell ? formatCellReference(selectedCell.row, selectedCell.col) : 'Cell'}
                    </div>
                    <input
                      type="text"
                      value={formulaBarValue}
                      onChange={(e) => setFormulaBarValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && selectedCell) {
                          const hot = getHotInstance();
                          if (hot) {
                            const newValue = formulaBarValue.trim();
                            hot.setDataAtCell(selectedCell.row, selectedCell.col, newValue);

                            // Handle formula if it starts with =
                            if (newValue.startsWith('=')) {
                              const cellKey = `${selectedCell.row}-${selectedCell.col}`;
                              setFormulaData(prev => {
                                const updated = { ...prev, [cellKey]: newValue };
                                // Update formula bar after state update
                                setTimeout(() => setFormulaBarValue(updated[cellKey]), 0);
                                return updated;
                              });
                              setTimeout(() => hot.render(), 10);
                            } else {
                              // Remove formula if it's not a formula anymore
                              setFormulaData(prev => {
                                const newData = { ...prev };
                                delete newData[`${selectedCell.row}-${selectedCell.col}`];
                                return newData;
                              });
                              setFormulaBarValue(newValue);
                            }
                          }
                        }
                      }}
                      placeholder="Enter formula or value..."
                      className="handsontable-formula-input"
                    />
                    <button
                      onClick={() => {
                        if (selectedCell) {
                          const hot = getHotInstance();
                          if (hot) {
                            const newValue = formulaBarValue.trim();
                            hot.setDataAtCell(selectedCell.row, selectedCell.col, newValue);

                            // Handle formula if it starts with =
                            if (newValue.startsWith('=')) {
                              const cellKey = `${selectedCell.row}-${selectedCell.col}`;
                              setFormulaData(prev => {
                                const updated = { ...prev, [cellKey]: newValue };
                                // Update formula bar after state update
                                setTimeout(() => setFormulaBarValue(updated[cellKey]), 0);
                                return updated;
                              });
                              setTimeout(() => hot.render(), 10);
                            } else {
                              // Remove formula if it's not a formula anymore
                              setFormulaData(prev => {
                                const newData = { ...prev };
                                delete newData[`${selectedCell.row}-${selectedCell.col}`];
                                return newData;
                              });
                              setFormulaBarValue(newValue);
                            }
                          }
                        }
                      }}
                      className="handsontable-formula-apply"
                    >
                      ✓
                    </button>
                  </div>
                  <div className="handsontable-formula-info">
                    {selectedCell ? `Editing: ${formatCellReference(selectedCell.row, selectedCell.col)}` : 'Select a cell to edit'}
                  </div>

                  {/* Quick Functions Section */}
                  <div className="handsontable-functions-separator">
                    <div className="handsontable-formula-section-label">
                      Quick Functions
                    </div>
                    <div className="handsontable-functions-grid">
                      {/* Math Functions */}
                      <button
                        onClick={() => insertFunction('SUM')}
                        className="handsontable-function-button"
                        disabled={!selectedCell}
                      >
                        SUM
                      </button>
                      <button
                        onClick={() => insertFunction('AVERAGE')}
                        className="handsontable-function-button"
                        disabled={!selectedCell}
                      >
                        AVG
                      </button>
                      <button
                        onClick={() => insertFunction('COUNT')}
                        className="handsontable-function-button"
                        disabled={!selectedCell}
                      >
                        COUNT
                      </button>
                      <button
                        onClick={() => insertFunction('MIN')}
                        className="handsontable-function-button"
                        disabled={!selectedCell}
                      >
                        MIN
                      </button>
                      <button
                        onClick={() => insertFunction('MAX')}
                        className="handsontable-function-button"
                        disabled={!selectedCell}
                      >
                        MAX
                      </button>
                      <button
                        onClick={() => insertFunction('ROUND')}
                        className="handsontable-function-button"
                        disabled={!selectedCell}
                      >
                        ROUND
                      </button>
                    </div>

                    <div className="handsontable-functions-grid">
                      {/* Text Functions */}
                      <button
                        onClick={() => insertFunction('LEN')}
                        className="handsontable-function-button"
                        disabled={!selectedCell}
                      >
                        LEN
                      </button>
                      <button
                        onClick={() => insertFunction('TRIM')}
                        className="handsontable-function-button"
                        disabled={!selectedCell}
                      >
                        TRIM
                      </button>
                      <button
                        onClick={() => insertFunction('UPPER')}
                        className="handsontable-function-button"
                        disabled={!selectedCell}
                      >
                        UPPER
                      </button>
                      <button
                        onClick={() => insertFunction('LOWER')}
                        className="handsontable-function-button"
                        disabled={!selectedCell}
                      >
                        LOWER
                      </button>
                      <button
                        onClick={() => insertFunction('CONCATENATE')}
                        className="handsontable-function-button"
                        disabled={!selectedCell}
                      >
                        CONCAT
                      </button>
                      <button
                        onClick={() => insertFunction('IF')}
                        className="handsontable-function-button"
                        disabled={!selectedCell}
                      >
                        IF
                      </button>
                    </div>

                    {/* Lookup Functions */}
                    <div className="handsontable-functions-section">
                      <div className="handsontable-functions-section-title">
                        Lookup:
                      </div>
                      <button
                        onClick={() => insertFunction('VLOOKUP')}
                        className="handsontable-function-button"
                        disabled={!selectedCell}
                      >
                        VLOOKUP
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <div
              className="handsontable-menu-dropdown-container"
              onMouseEnter={() => setActiveMenu('view')}
              onMouseLeave={() => setActiveMenu(null)}
            >
              <button
                className={`handsontable-menu-button ${activeMenu === 'view' ? 'active' : ''}`}
              >
                View
              </button>
              {activeMenu === 'view' && (
                <div className="handsontable-menu-dropdown">
                  <div className="handsontable-menu-dropdown-placeholder">
                    Coming Soon
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Formatting Toolbar */}
        <div className="handsontable-toolbar">
          {/* Text Formatting */}
          <div className="handsontable-toolbar-section">
            <button
              tabIndex={-1}
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                const hot = getHotInstance();
                if (hot) {
                  const selected = hot.getSelected();
                  if (selected && selected.length > 0) {
                    setSelectionRef(JSON.parse(JSON.stringify(selected)));
                  }
                }
                handleBold();
                setTimeout(updateActiveFormatting, 50);
                return false;
              }}
              className={`handsontable-toolbar-button bold ${activeFormatting.bold ? 'active' : ''}`}
              title="Bold (Ctrl+B)"
            >
              <strong>B</strong>
            </button>
            <button
              tabIndex={-1}
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                const hot = getHotInstance();
                if (hot) {
                  const selected = hot.getSelected();
                  if (selected && selected.length > 0) {
                    setSelectionRef(JSON.parse(JSON.stringify(selected)));
                  }
                }
                handleItalic();
                setTimeout(updateActiveFormatting, 50);
                return false;
              }}
              className={`handsontable-toolbar-button italic ${activeFormatting.italic ? 'active' : ''}`}
              title="Italic (Ctrl+I)"
            >
              <em>I</em>
            </button>
            <button
              tabIndex={-1}
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                const hot = getHotInstance();
                if (hot) {
                  const selected = hot.getSelected();
                  if (selected && selected.length > 0) {
                    setSelectionRef(JSON.parse(JSON.stringify(selected)));
                  }
                }
                handleUnderline();
                setTimeout(updateActiveFormatting, 50);
                return false;
              }}
              className={`handsontable-toolbar-button underline ${activeFormatting.underline ? 'active' : ''}`}
              title="Underline (Ctrl+U)"
            >
              <u>U</u>
            </button>
          </div>

          <div className="handsontable-toolbar-separator" />

          {/* Font Size */}
          <div className="handsontable-toolbar-section">
            <label className="handsontable-toolbar-label">Size:</label>
            <select
              value={activeFormatting.fontSize}
              onChange={(e) => {
                handleFontSize(e.target.value);
                setTimeout(updateActiveFormatting, 50);
              }}
              className="handsontable-font-size-select"
            >
              <option value="10">10</option>
              <option value="12">12</option>
              <option value="14">14</option>
              <option value="16">16</option>
              <option value="18">18</option>
              <option value="20">20</option>
              <option value="24">24</option>
              <option value="28">28</option>
              <option value="32">32</option>
            </select>
          </div>

          <div className="handsontable-toolbar-separator" />

          {/* Colors */}
          <div className="handsontable-toolbar-section">
            <label className="handsontable-toolbar-label">Text:</label>
            <input
              type="color"
              value={activeFormatting.color}
              onChange={(e) => {
                handleFontColor(e.target.value);
                setTimeout(updateActiveFormatting, 50);
              }}
              className="handsontable-color-picker"
              title="Font Color"
            />
            <label className="handsontable-toolbar-label">Fill:</label>
            <input
              type="color"
              value={activeFormatting.backgroundColor}
              onChange={(e) => {
                handleBackgroundColor(e.target.value);
                setTimeout(updateActiveFormatting, 50);
              }}
              className="handsontable-color-picker"
              title="Background Color"
            />
          </div>

          <div className="handsontable-toolbar-separator" />

          {/* Alignment */}
          <div className="handsontable-toolbar-section">
            <button
              tabIndex={-1}
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleAlignment('left');
                setTimeout(updateActiveFormatting, 50);
                return false;
              }}
              className={`handsontable-toolbar-button align-left ${activeFormatting.textAlign === 'left' ? 'active' : ''}`}
              title="Align Left"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M2 4H14M2 8H10M2 12H14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                <path d="M1 4L3 6L1 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
              </svg>
            </button>
            <button
              tabIndex={-1}
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleAlignment('center');
                setTimeout(updateActiveFormatting, 50);
                return false;
              }}
              className={`handsontable-toolbar-button align-center ${activeFormatting.textAlign === 'center' ? 'active' : ''}`}
              title="Align Center"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M2 4H14M4 8H12M2 12H14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </button>
            <button
              tabIndex={-1}
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleAlignment('right');
                setTimeout(updateActiveFormatting, 50);
                return false;
              }}
              className={`handsontable-toolbar-button align-right ${activeFormatting.textAlign === 'right' ? 'active' : ''}`}
              title="Align Right"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M2 4H14M4 8H14M2 12H14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                <path d="M15 4L13 6L15 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
              </svg>
            </button>
          </div>

          {/* Search Section */}
          <div className="handsontable-search-section">
            <div className="handsontable-search-container">
              <HiSearch size={18} className="handsontable-search-icon" />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="handsontable-search-input"
                onFocus={(e) => e.currentTarget.style.borderColor = '#2563eb'}
                onBlur={(e) => e.currentTarget.style.borderColor = 'var(--color-border-1)'}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="handsontable-clear-search"
                >
                  <HiX size={16} />
                </button>
              )}
            </div>
            <button
              onClick={handleSearch}
              disabled={!searchQuery}
              className={`handsontable-search-button ${searchQuery ? '' : 'disabled'}`}
              title="Search"
            >
              <HiSearch size={18} />
            </button>
          </div>
        </div>

        {/* Table Container */}
        <div
          onContextMenu={(e) => {
            // Let the HotTable handle context menu first
            const hot = getHotInstance();
            if (hot) {
              handleContextMenu(e);
            }
          }}
          className="handsontable-table-container"
        >
          <HotTable
            ref={hotTableComponent}
            data={data}
            colHeaders={true}
            rowHeaders={true}
            width="100%"
            licenseKey="non-commercial-and-evaluation"
            contextMenu={false}
            manualColumnResize={true}
            manualRowResize={true}
            filters={true}
            dropdownMenu={true}
            copyPaste={true}
            mergeCells={true}
            columnSorting={true}
            autoWrapRow={true}
            autoWrapCol={true}
            fixedRowsTop={1}
            fixedColumnsLeft={1}
            undo={true}
            search={true}
            minSpareRows={50}
            minSpareCols={20}
            className="handsontable-dark"
            cells={(row, col) => {
              const cellKey = `${row}-${col}`;
              const currentFormulaData = formulaData;
              const hasFormula = currentFormulaData[cellKey];
              
              if (hasFormula) {
                return {
                  renderer: function(instance, td, row, col, prop, value, cellProperties) {
                    // Get default text renderer
                    const Handsontable = instance.constructor || window.Handsontable;
                    let defaultRenderer = null;
                    if (Handsontable && Handsontable.renderers) {
                      defaultRenderer = Handsontable.renderers.getRenderer('text') || 
                                       Handsontable.renderers.TextRenderer ||
                                       Handsontable.renderers.textRenderer;
                    }
                    
                    // Calculate formula result
                    const formula = currentFormulaData[`${row}-${col}`];
                    let result;
                    try {
                      result = calculateFormula(formula, row, col);
                      if (typeof result === 'number' && isNaN(result)) {
                        result = '#ERROR!';
                      }
                    } catch (e) {
                      result = '#ERROR!';
                    }
                    
                    // Render the result
                    if (defaultRenderer && typeof defaultRenderer === 'function') {
                      // Use default renderer but with calculated value
                      const oldValue = value;
                      value = result;
                      try {
                        defaultRenderer.apply(this, arguments);
                      } catch (e) {
                        td.innerHTML = String(result);
                      }
                      value = oldValue;
                    } else {
                      td.innerHTML = String(result);
                    }
                    
                    // Apply formatting if any
                    const formatting = cellProperties.formatting || {};
                    if (formatting.fontWeight) td.style.fontWeight = formatting.fontWeight;
                    if (formatting.fontStyle) td.style.fontStyle = formatting.fontStyle;
                    if (formatting.textDecoration) td.style.textDecoration = formatting.textDecoration;
                    if (formatting.fontSize) td.style.fontSize = formatting.fontSize;
                    if (formatting.color) td.style.color = formatting.color;
                    if (formatting.backgroundColor) td.style.backgroundColor = formatting.backgroundColor;
                    if (formatting.textAlign) td.style.textAlign = formatting.textAlign;
                  }
                };
              }
            }}
            afterChange={(changes, source) => {
              if (source === 'edit' || source === 'paste') {
                const hot = getHotInstance();
                // Collect all formula changes first
                const formulaChanges = [];
                changes?.forEach(([row, col, oldValue, newValue]) => {
                  const cellKey = `${row}-${col}`;

                  let finalFormula = newValue;

                  // If this is a paste operation and we have copied cells, adjust formulas
                  if (source === 'paste' && copiedCells.length > 0 && typeof newValue === 'string' && newValue.trim().startsWith('=')) {
                    // Find the source cell that corresponds to this paste destination
                    // For paste operations, we need to match by position in the copied array
                    const selected = hot.getSelected();
                    if (selected && selected.length > 0) {
                      const [pasteStartRow, pasteStartCol] = selected[0];
                      const relativeRow = row - pasteStartRow;
                      const relativeCol = col - pasteStartCol;

                      // Find the corresponding source cell
                      const sourceCell = copiedCells.find(cell =>
                        cell.row - copiedCells[0].row === relativeRow &&
                        cell.col - copiedCells[0].col === relativeCol
                      );

                      if (sourceCell && sourceCell.formula) {
                        // Adjust the formula for the new location
                        finalFormula = adjustFormulaForCopy(sourceCell.formula, sourceCell.row, sourceCell.col, row, col);
                      }
                    }
                  }

                  formulaChanges.push({
                    cellKey,
                    finalFormula: typeof finalFormula === 'string' && finalFormula.trim().startsWith('=') ? finalFormula.trim() : null
                  });
                });

                // Apply all formula changes
                setFormulaData(prev => {
                  const newData = { ...prev };
                  formulaChanges.forEach(({ cellKey, finalFormula }) => {
                    if (finalFormula) {
                      newData[cellKey] = finalFormula;
                    } else {
                      delete newData[cellKey];
                    }
                  });
                  // Update dependency graph
                  setDependencyGraph(buildDependencyGraph(newData));
                  return newData;
                });

                // Clear copied cells after paste operation
                if (source === 'paste') {
                  setCopiedCells([]);
                }

                // Find cells that need to be recalculated due to changes
                const cellsToRecalculate = new Set();
                changes?.forEach(([row, col]) => {
                  const changedCellKey = `${row}-${col}`;
                  const dependents = getDependentCells(changedCellKey, dependencyGraph);
                  dependents.forEach(dep => cellsToRecalculate.add(dep));
                });

                // Force render only the cells that need recalculation
                setTimeout(() => {
                  if (hot) {
                    // Render all cells that have formulas or depend on changed cells
                    const allFormulaCells = new Set([...Object.keys(formulaData), ...cellsToRecalculate]);
                    allFormulaCells.forEach(() => {
                      hot.render();
                    });
                    // Full render for now - can be optimized later to render only specific cells
                    hot.render();
                  }
                }, 10);
              }
            }}
            afterSelection={(r, c, r2, c2) => {
              const hot = getHotInstance();
              if (hot) {
                const selected = hot.getSelected();
                if (selected && selected.length > 0) {
                  setSelectionRef(JSON.parse(JSON.stringify(selected)));
                  updateActiveFormatting();
                  
                  // Update formula bar with selected cell
                  const [startRow, startCol] = selected[0];
                  setSelectedCell({ row: startRow, col: startCol });
                  const cellKey = `${startRow}-${startCol}`;
                  const formula = formulaData[cellKey];
                  if (formula) {
                    setFormulaBarValue(formula);
                  } else {
                    const cellValue = hot.getDataAtCell(startRow, startCol);
                    setFormulaBarValue(cellValue !== null && cellValue !== undefined ? String(cellValue) : '');
                  }
                }
              }
            }}
            afterSelectionEnd={(r, c, r2, c2) => {
              const hot = getHotInstance();
              if (hot) {
                const selected = hot.getSelected();
                if (selected && selected.length > 0) {
                  setSelectionRef(JSON.parse(JSON.stringify(selected)));
                  updateActiveFormatting();
                  
                  // Update formula bar with selected cell
                  const [startRow, startCol] = selected[0];
                  setSelectedCell({ row: startRow, col: startCol });
                  const cellKey = `${startRow}-${startCol}`;
                  const formula = formulaData[cellKey];
                  if (formula) {
                    setFormulaBarValue(formula);
                  } else {
                    const cellValue = hot.getDataAtCell(startRow, startCol);
                    setFormulaBarValue(cellValue !== null && cellValue !== undefined ? String(cellValue) : '');
                  }
                }
              }
            }}
            beforeBlur={(current, next) => {
              // Prevent blur if clicking on formatting toolbar buttons
              if (next && next.target) {
                const target = next.target;
                const isFormatButton = target.closest('button') &&
                  (target.closest('button').title?.includes('Bold') ||
                   target.closest('button').title?.includes('Italic') ||
                   target.closest('button').title?.includes('Underline') ||
                   target.closest('button').title?.includes('Align'));
                if (isFormatButton) {
                  return false; // Prevent blur
                }
              }
            }}
            afterCreateRow={(index, amount) => {
              // Expand data array when new rows are created - ensure unlimited growth
              const hot = getHotInstance();
              if (hot) {
                const currentData = hot.getData();
                const numCols = hot.countCols();
                // Ensure we have enough rows in the data array
                while (currentData.length < hot.countRows()) {
                  currentData.push(Array(numCols).fill(''));
                }
              }
            }}
            afterCreateCol={(index, amount) => {
              // Expand data array when new columns are created - ensure unlimited growth
              const hot = getHotInstance();
              if (hot) {
                const currentData = hot.getData();
                const numCols = hot.countCols();
                // Ensure all rows have enough columns
                currentData.forEach(row => {
                  while (row.length < numCols) {
                    row.push('');
                  }
                });
              }
            }}
          />
        </div>

        {/* Custom Context Menu */}
        {contextMenu.show && (
          <>
            <div
              className="handsontable-context-overlay"
              onClick={closeContextMenu}
              onContextMenu={(e) => {
                e.preventDefault();
                closeContextMenu();
              }}
            />
            <div
              data-context-menu
              className="handsontable-context-menu"
              style={{
                left: `${Math.min(contextMenu.x, window.innerWidth - 240)}px`,
                top: `${Math.min(contextMenu.y, window.innerHeight - 450)}px`
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Clipboard Section */}
              <div className="handsontable-context-section">
                <button
                  onClick={handleCopy}
                  className="handsontable-context-item"
                >
                  <div className="handsontable-context-icon">
                    <HiClipboardCopy size={18} />
                  </div>
                  <span className="handsontable-context-text">Copy</span>
                  <span className="handsontable-context-shortcut">Ctrl+C</span>
                </button>
                <button
                  onClick={handleCut}
                  className="handsontable-context-item"
                >
                  <div className="handsontable-context-icon">
                    <HiClipboard size={18} />
                  </div>
                  <span className="handsontable-context-text">Cut</span>
                  <span className="handsontable-context-shortcut">Ctrl+X</span>
                </button>
                <button
                  onClick={handlePaste}
                  className="handsontable-context-item"
                >
                  <div className="handsontable-context-icon">
                    <HiClipboardCopy size={18} />
                  </div>
                  <span className="handsontable-context-text">Paste</span>
                  <span className="handsontable-context-shortcut">Ctrl+V</span>
                </button>
              </div>

              <div className="handsontable-menu-separator" />

              {/* Insert Section */}
              <div className="handsontable-context-section">
                <div className="handsontable-context-section-label">
                  Insert
                </div>
                <button
                  onClick={handleInsertRowAbove}
                  className="handsontable-context-item"
                >
                  <div className="handsontable-context-icon">
                    <HiPlus size={18} />
                  </div>
                  <span className="handsontable-context-text">Row Above</span>
                </button>
                <button
                  onClick={handleInsertRowBelow}
                  className="handsontable-context-item"
                >
                  <div className="handsontable-context-icon">
                    <HiPlus size={18} />
                  </div>
                  <span className="handsontable-context-text">Row Below</span>
                </button>
                <button
                  onClick={handleInsertColumnLeft}
                  className="handsontable-context-item"
                >
                  <div className="handsontable-context-icon">
                    <HiPlus size={18} />
                  </div>
                  <span className="handsontable-context-text">Column Left</span>
                </button>
                <button
                  onClick={handleInsertColumnRight}
                  className="handsontable-context-item"
                >
                  <div className="handsontable-context-icon">
                    <HiPlus size={18} />
                  </div>
                  <span className="handsontable-context-text">Column Right</span>
                </button>
              </div>

              <div className="handsontable-menu-separator" />

              {/* Delete Section */}
              <div className="handsontable-context-section">
                <div className="handsontable-context-section-label">
                  Delete
                </div>
                <button
                  onClick={() => {
                    handleDeleteRow();
                    closeContextMenu();
                  }}
                  className="handsontable-context-item danger"
                >
                  <div className="handsontable-context-icon danger">
                    <HiTrash size={18} />
                  </div>
                  <span className="handsontable-context-text">Row</span>
                </button>
                <button
                  onClick={() => {
                    handleDeleteColumn();
                    closeContextMenu();
                  }}
                  className="handsontable-context-item danger"
                >
                  <div className="handsontable-context-icon danger">
                    <HiTrash size={18} />
                  </div>
                  <span className="handsontable-context-text">Column</span>
                </button>
              </div>

              <div className="handsontable-menu-separator" />

              {/* Other Actions */}
              <div>
                <button
                  onClick={handleClearContents}
                  className="handsontable-context-item"
                >
                  <div className="handsontable-context-icon">
                    <HiMinus size={18} />
                  </div>
                  <span className="handsontable-context-text">Clear Contents</span>
                </button>
              </div>
            </div>
          </>
        )}
        
        <div className="handsontable-tips">
          <p>
            <strong>Tips:</strong> Right-click on cells for context menu. Formulas automatically recalculate when data changes.
            Use column headers to sort and filter. Use Ctrl+Z/Ctrl+Y for undo/redo.
          </p>
        </div>
      </div>
    </div>
  );
};

export default HandsontablePage;

