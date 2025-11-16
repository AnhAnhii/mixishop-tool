import React, { useState, useMemo, useCallback, useEffect } from 'react';
import type { Product } from '../types';
import { UploadIcon, CopyIcon, RefreshIcon, NewLineIcon } from './icons';

// Make sure xlsx is available from the script tag in index.html
declare var XLSX: any;

interface OrderProcessorProps {
  products: Product[];
}

interface ProcessedItem {
  id: number;
  text: string;
}

// FIX: Define props interface for EditableResultLine
interface EditableResultLineProps {
    item: ProcessedItem;
    onUpdate: (id: number, text: string) => void;
    onSplit: (id: number) => void;
}

// Sub-component for editable lines to prevent re-renders on every keystroke
// FIX: Use React.FC with the props interface to correctly type the component
const EditableResultLine: React.FC<EditableResultLineProps> = ({ item, onUpdate, onSplit }) => {
    const [text, setText] = useState(item.text);
    const isUnrecognized = item.text.startsWith('[KHÔNG NHẬN DẠNG ĐƯỢỢC]:');

    useEffect(() => {
        setText(item.text);
    }, [item.text]);

    const handleBlur = () => {
        if (text !== item.text) {
            onUpdate(item.id, text);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            if (text !== item.text) {
                onUpdate(item.id, text);
            }
        }
    };

    return (
        <div className="flex items-center gap-2 group">
            <input
                type="text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                onBlur={handleBlur}
                onKeyDown={handleKeyDown}
                className={`flex-grow w-full bg-transparent p-0.5 rounded focus:outline-none focus:bg-slate-800 ${
                    isUnrecognized ? 'text-amber-400 border border-transparent focus:border-amber-500' : 'text-slate-200'
                }`}
            />
            <button
                onClick={() => onSplit(item.id)}
                className="flex-shrink-0 opacity-0 group-hover:opacity-100 text-slate-400 hover:text-sky-400 transition-opacity"
                aria-label="Tách xuống dòng mới"
                title="Tách xuống dòng mới"
            >
                <NewLineIcon />
            </button>
        </div>
    );
};


const OrderProcessor: React.FC<OrderProcessorProps> = ({ products }) => {
  const [processedData, setProcessedData] = useState<ProcessedItem[]>([]);
  const [hiddenData, setHiddenData] = useState<ProcessedItem[]>([]);
  const [fileName, setFileName] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [copySuccess, setCopySuccess] = useState<string>('');
  const [filterQuery, setFilterQuery] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'unrecognized'>('all');


  const sortedProductNames = useMemo(() => {
    return products.map(p => p.name).sort((a, b) => b.length - a.length);
  }, [products]);

  const splitConcatenatedProducts = useCallback((text: string): string[] => {
    if (!text || !text.trim()) {
      return [];
    }
     // A comprehensive set of rules derived from the entire conversation history.
    // Order is critical for correctness.
    const PREP_RULES: [RegExp, string | ((...args: any[]) => string)][] = [
        // ====== PHASE 0: Aggressive Initial Cleanup & Normalization ======
        [/[\s\u00A0]+/g, ' '],
        [/"/g, ''],
        [/^\s*\+\s*|\s*\+\s*$/g, ''],
        [/([,; ])\s*\+\s*/g, '$1'],
        [/size/gi, ''],
        [/1 x 1 x/gi, '1 x'],

        // ====== PHASE 1: Handle Specific Aliases & Complex Variations (Most Specific First!) ======
        // NOTE: Using `kho[áa]` to handle both `khóa` and `khoá` accent variations.
        
        [/móc\s*ss1\s*1\s*ẻm/gi, 'Móc vịt'], 
        [/Móc kho[áa] 1 ẻm Móc vịt SS2/gi, 'Móc vịt Móc vịt SS2'],
        [/Móc kho[áa] SS2 1 ẻm/gi, 'Móc vịt SS2'],
        [/Móc kho[áa] SS2/gi, 'Móc vịt SS2'],
        [/Móc kho[áa] 1 ẻm ss1/gi, 'Móc vịt'],
        [/móc kho[áa]? ss1 1 ẻm/gi, 'Móc vịt'],
        [/Móc kho[áa] SS1/gi, 'Móc vịt'],
        [/1 ẻm SS2/gi, 'Móc vịt SS2'],
        [/Móc kho[áa] 1 ẻm/gi, 'Móc vịt'],
        
        [/Đầu bịt 1 ẻm/gi, 'Đầu bịt'],
        [/set ống hút\s*(hồng|đen|trắng)\s*(hồng|đen|trắng)/gi, 'Ống hút $1 Ống hút $2'],
        [/BỘ ỐNG HÚT\s*(HỒNG|ĐEN|TRẮNG)/gi, 'Ống hút $1'],
        [/set ống\s*(HỒNG|ĐEN|TRẮNG)/gi, 'Ống hút $1'],
        [/(\d*)\s*NẮP\s*(HỒNG|ĐEN|TRẮNG)/gi, (match, num, color) => `${num || '1'} x Nắp ${color.toLowerCase()}`],
        [/Cốc Sticker a Độ\s*\(([^)]+)\)/gi, (_match, color) => `Cốc sticker - ${color.charAt(0).toUpperCase() + color.slice(1).toLowerCase()}`],
        [/(Cốc Mixi 1200ml|Cốc sticker)\s*Color\s*(Trắng|Đen|Hồng)/gi, '$1 - $2'],
        
        [/Cốc Mixi\s*Trắng/gi, 'Cốc Mixi 1200ml - Trắng'],
        [/Cốc Mixi 1200ml - Hồng(?! quai)/gi, 'Cốc Mixi 1200ml - Hồng quai đen'],
        
        // ====== PHASE 2: Structural Fixes (Adding hyphens, inferring words) ======
        [/(Cốc sticker|Cốc Vịt|Cốc Mixi 1200ml)\s*(Đen quai hồng|Hồng quai đen)/gi, '$1 - $2'],
        [/(Cốc sticker|Cốc Vịt|Cốc Mixi 1200ml)\s*(Đen)\s*(Hồng)/gi, '$1 - $2 quai $3'],
        [/(Cốc sticker|Cốc Vịt|Cốc Mixi 1200ml)\s*(Hồng)\s*(Đen)/gi, '$1 - $2 quai $3'],
        
        [/(Bình giữ nhiệt Mixi|Cốc Mixi 1200ml|Cốc sticker|Cốc vịt|Áo nỉ dài tay Mixi|Áo logo 2023)\s*(Đen|Trắng|Hồng)(?! quai)/gi, '$1 - $2'],
        
        // ====== PHASE 3: Final Cleanup (convert all separators to a single space) ======
        [/[,;]/g, ' '],
        [/[\s\u00A0]+/g, ' '],
    ];

    let processedLine = text.trim();
    for (const [pattern, replacer] of PREP_RULES) {
        processedLine = processedLine.replace(pattern, replacer as any);
    }
    processedLine = processedLine.trim();
    
    const results: string[] = [];
    let remainingText = processedLine;
    
    while (remainingText.length > 0) {
        let matchFound = false;
        
        const quantityMatch = remainingText.match(/^(?:(\d+)\s*x\s*)?(?:(\d+)\s+)?/);
        let quantityPrefix = '';
        let textToParse = remainingText;
        
        if (quantityMatch) {
            const prefixX = quantityMatch[1]; // e.g., '1' from '1 x'
            const directNum = quantityMatch[2]; // e.g., '2' from '2 Áo...'
            
            if (!directNum && prefixX) {
                quantityPrefix = `${prefixX} x `;
            } else if (directNum) {
                 quantityPrefix = `${prefixX ? prefixX + ' x ' : ''}${directNum} `;
            }

            textToParse = remainingText.substring(quantityMatch[0].length).trim();
        }
        
        for (const productName of sortedProductNames) {
            if (textToParse.toLowerCase().startsWith(productName.toLowerCase())) {
                let finalProductName = productName;
                let tempRemainingText = textToParse.substring(productName.length).trim();

                const lowerProductName = productName.toLowerCase();
                const isApparel = ['áo', 'bộ quần áo', 'quần'].some(kw => lowerProductName.startsWith(kw));
                const isFootwear = lowerProductName.startsWith('dép');
                
                if (isApparel || isFootwear) {
                    const colorAndSizeRegex = /^\s*(đen|trắng|hồng|đỏ)\s*(m|l|xl|2xl|\d{2}(?:-\d{2})?)?\b/i;
                    const sizeOnlyRegex = /^\s*(m|l|xl|2xl|\d{2}(?:-\d{2})?)\b/i;
                    
                    let attributeString = '';
                    let consumedLength = 0;
                    
                    let match = tempRemainingText.match(colorAndSizeRegex);
                    if (match) {
                        attributeString = ` ${match[0].trim()}`;
                        consumedLength = match[0].length;
                    } else {
                        match = tempRemainingText.match(sizeOnlyRegex);
                        if (match) {
                            attributeString = ` ${match[0].trim()}`;
                            consumedLength = match[0].length;
                        }
                    }

                    if (consumedLength > 0) {
                        finalProductName += attributeString;
                        tempRemainingText = tempRemainingText.substring(consumedLength).trim();
                    }
                }
                
                results.push(`${quantityPrefix}${finalProductName}`.trim());
                remainingText = tempRemainingText;
                matchFound = true;
                break;
            }
        }

        if (!matchFound) {
            if (remainingText.length > 0) {
                results.push(`[KHÔNG NHẬN DẠNG ĐƯỢỢC]: ${remainingText}`);
            }
            break;
        }
    }
    return results;
  }, [sortedProductNames]);
  
  const handleUpdateAndReprocess = useCallback((id: number, newText: string) => {
    const splitLines = splitConcatenatedProducts(newText);
    const hasRecognizedProduct = splitLines.some(l => !l.startsWith('[KHÔNG NHẬN DẠNG ĐƯỢỢC]:'));

    setProcessedData(currentData => {
        const index = currentData.findIndex(item => item.id === id);
        if (index === -1) return currentData;
        
        const newData = [...currentData];

        if (hasRecognizedProduct) {
            const newItems = splitLines.map((line, i) => ({
                id: Date.now() + Math.random() + i,
                text: line,
            }));
            newData.splice(index, 1, ...newItems);
        } else {
            // No recognized product, so move it to hidden
            newData.splice(index, 1); // Remove from processed data
            setHiddenData(currentHidden => {
                const trimmedNewText = newText.replace(/^\[KHÔNG NHẬN DẠNG ĐƯỢỢC\]:\s*/, '').trim();
                if (!currentHidden.some(item => item.text === trimmedNewText)) {
                    return [...currentHidden, { id: Date.now() + Math.random(), text: trimmedNewText }];
                }
                return currentHidden;
            });
        }
        return newData;
    });
  }, [splitConcatenatedProducts]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setIsLoading(true);
    setError(null);
    setProcessedData([]);
    setHiddenData([]);
    setCopySuccess('');
    setFilterQuery('');
    setFilterMode('all');

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        const validItemsBuffer: ProcessedItem[] = [];
        const hiddenItemsBuffer: ProcessedItem[] = [];
        const rawLines = json.map(row => row[0] ? String(row[0]).trim() : '').filter(Boolean);

        rawLines.forEach(line => {
          const splitLines = splitConcatenatedProducts(line);
          const hasRecognizedProduct = splitLines.some(l => !l.startsWith('[KHÔNG NHẬN DẠNG ĐƯỢỢC]:'));
    
          if (hasRecognizedProduct) {
            splitLines.forEach(l => validItemsBuffer.push({ id: Date.now() + Math.random(), text: l }));
          } else {
            // If no products found, hide the original line.
            if(line) hiddenItemsBuffer.push({ id: Date.now() + Math.random(), text: line });
          }
        });

        setProcessedData(validItemsBuffer);
        setHiddenData(hiddenItemsBuffer);

      } catch (err) {
        setError('Đã xảy ra lỗi khi xử lý file. Vui lòng kiểm tra định dạng file.');
      } finally {
        setIsLoading(false);
      }
    };
    reader.onerror = () => {
        setError('Không thể đọc file.');
        setIsLoading(false);
    }
    reader.readAsArrayBuffer(file);
    e.target.value = '';
  };
  
  const handleCopyToClipboard = (textToCopy: string) => {
    navigator.clipboard.writeText(textToCopy).then(() => {
        setCopySuccess('Đã sao chép!');
        setTimeout(() => setCopySuccess(''), 2000);
    }, () => {
        setCopySuccess('Sao chép thất bại!');
        setTimeout(() => setCopySuccess(''), 2000);
    });
  };

  const handleReProcess = useCallback(() => {
    const rawLines = processedData.map(item => 
        item.text.replace(/^\[KHÔNG NHẬN DẠNG ĐƯỢỢC\]:\s*/, '')
      );
    
    const validItemsBuffer: ProcessedItem[] = [];
    const hiddenItemsBuffer: ProcessedItem[] = [];

    rawLines.forEach(line => {
      if (!line) return;
      const splitLines = splitConcatenatedProducts(line);
      const hasRecognizedProduct = splitLines.some(l => !l.startsWith('[KHÔNG NHẬN DẠNG ĐƯỢỢC]:'));

      if (hasRecognizedProduct) {
        splitLines.forEach(l => validItemsBuffer.push({ id: Date.now() + Math.random(), text: l }));
      } else {
        hiddenItemsBuffer.push({ id: Date.now() + Math.random(), text: line });
      }
    });

    setProcessedData(validItemsBuffer);
    
    setHiddenData(currentHidden => {
      const newHiddenMap = new Map<string, ProcessedItem>();
      currentHidden.forEach(item => newHiddenMap.set(item.text, item));
      hiddenItemsBuffer.forEach(item => newHiddenMap.set(item.text, item));
      return Array.from(newHiddenMap.values());
    });
    
    setCopySuccess('Đã cập nhật!');
    setTimeout(() => setCopySuccess(''), 2000);
  }, [processedData, splitConcatenatedProducts]);

  const handleSplitLine = useCallback((idToSplit: number) => {
    setProcessedData(currentData => {
        const newArray: ProcessedItem[] = [];
        currentData.forEach(item => {
            newArray.push(item);
            if (item.id === idToSplit) {
                newArray.push({ id: Date.now() + Math.random(), text: '' });
            }
        });
        return newArray;
    });
  }, []);

  const productStats = useMemo(() => {
    const stats = new Map<string, { originalName: string, count: number }>();

    processedData.forEach(item => {
        const text = item.text.trim();
        if (text.startsWith('[KHÔNG NHẬN DẠNG ĐƯỢỢC]:')) return;
        
        const match = text.match(/^(?:(\d+)\s*x\s*)?(?:(\d+)\s+)?(.*)$/);
        if (!match) return;

        const directQuantity = match[2];
        const name = (match[3] || '').trim();
        
        const quantity = parseInt(directQuantity || '1', 10);
        
        if (name) {
            const lowerName = name.toLowerCase();
            const existing = stats.get(lowerName);
            if (existing) {
                existing.count += quantity;
            } else {
                stats.set(lowerName, { originalName: name, count: quantity });
            }
        }
    });

    return Array.from(stats.values())
      .map(value => [value.originalName, value.count] as [string, number])
      .sort((a, b) => b[1] - a[1]);
  }, [processedData]);

  const filteredData = useMemo(() => {
    let data = processedData;
    if (filterMode === 'unrecognized') {
        data = data.filter(item => item.text.startsWith('[KHÔNG NHẬN DẠNG ĐƯỢỢC]:'));
    }
    if (!filterQuery) return data;
    return data.filter(item => item.text.toLowerCase().includes(filterQuery.toLowerCase()));
  }, [processedData, filterQuery, filterMode]);
  
  const filteredStats = useMemo(() => {
    if (!filterQuery) return productStats;
    return productStats.filter(([name]) => name.toLowerCase().includes(filterQuery.toLowerCase()));
  }, [productStats, filterQuery]);

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 p-6 rounded-xl shadow-lg space-y-4">
      <div>
        <h2 className="text-lg font-bold text-sky-400 mb-1">Bộ xử lý đơn hàng</h2>
        <p className="text-slate-400 text-sm">Tải lên file Excel (.xlsx, .xls) chứa các dòng sản phẩm gộp. Hệ thống sẽ tự động bóc tách và chuẩn hóa tên sản phẩm.</p>
      </div>
      
      <label htmlFor="file-upload" className="relative cursor-pointer flex items-center justify-center w-full h-24 px-4 transition bg-slate-900 border-2 border-slate-600 border-dashed rounded-md appearance-none hover:border-sky-500 focus:outline-none">
        <span className="flex items-center space-x-2 text-center">
            <UploadIcon />
            <span className="font-medium text-slate-400">
                {fileName || 'Click hoặc kéo thả file Excel vào đây'}
            </span>
        </span>
        <input id="file-upload" name="file-upload" type="file" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" accept=".xlsx, .xls" onChange={handleFileChange} />
      </label>

      {isLoading && (
        <div className="text-center py-10">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-400 mx-auto"></div>
          <p className="text-slate-400 mt-3">Đang xử lý file...</p>
        </div>
      )}

      {error && (
         <div className="text-center py-4 bg-red-900/50 border border-red-700 rounded-lg">
            <p className="text-red-400">{error}</p>
        </div>
      )}

      {(processedData.length > 0 || hiddenData.length > 0) && !isLoading && (
        <div className="space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-sm font-medium text-slate-400">Bộ lọc:</span>
                <button
                    onClick={() => setFilterMode('all')}
                    className={`px-3 py-1 text-sm rounded-full transition-colors ${filterMode === 'all' ? 'bg-sky-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
                >
                    Tất cả
                </button>
                <button
                    onClick={() => setFilterMode('unrecognized')}
                    className={`px-3 py-1 text-sm rounded-full transition-colors ${filterMode === 'unrecognized' ? 'bg-amber-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
                >
                    Chưa nhận dạng
                </button>
              </div>
              <input
                type="text"
                value={filterQuery}
                onChange={(e) => setFilterQuery(e.target.value)}
                placeholder="Tìm kiếm trong kết quả..."
                className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-200 placeholder-slate-500"
              />
            </div>
          <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="flex justify-between items-center mb-2">
                    <h3 className="text-lg font-semibold text-slate-300">Kết quả xử lý ({filteredData.length})</h3>
                    <div className="relative flex items-center gap-2">
                        <button
                            onClick={handleReProcess}
                            className="flex items-center gap-2 bg-slate-600 text-white px-3 py-2 rounded-lg hover:bg-slate-500 transition-colors text-sm"
                            aria-label="Cập nhật và xử lý lại"
                            title="Cập nhật và xử lý lại"
                        >
                            <RefreshIcon/> Cập nhật
                        </button>
                        <button
                            onClick={() => handleCopyToClipboard(filteredData.map(item => item.text).join('\n'))}
                            className="flex items-center gap-2 bg-sky-600 text-white px-3 py-2 rounded-lg hover:bg-sky-500 transition-colors text-sm"
                            aria-label="Sao chép kết quả"
                        >
                            <CopyIcon/> Sao chép
                        </button>
                        {copySuccess && <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max bg-slate-700 text-white text-xs rounded py-1 px-2">{copySuccess}</span>}
                    </div>
                </div>
                <div className="w-full h-64 bg-slate-900 border border-slate-600 rounded-lg p-3 space-y-1 overflow-y-auto font-mono text-sm">
                  {filteredData.map((item) => (
                    <EditableResultLine 
                        key={item.id}
                        item={item}
                        onUpdate={handleUpdateAndReprocess}
                        onSplit={handleSplitLine}
                    />
                  ))}
                </div>
              </div>

              <div className="sm:w-1/3">
                 <h3 className="text-lg font-semibold text-slate-300 mb-2">Thống kê ({filterMode === 'all' ? filteredStats.length : 0})</h3>
                 <div className="h-64 bg-slate-900 border border-slate-600 rounded-lg p-3 space-y-2 overflow-y-auto">
                    {filterMode === 'all' && filteredStats.length > 0 ? (
                        filteredStats.map(([name, count]) => (
                            <div key={name} className="flex justify-between items-center text-sm p-1.5 rounded bg-slate-800/50">
                                <span className="text-slate-300 truncate pr-2">{name}</span>
                                <span className="flex-shrink-0 font-bold text-sky-400 bg-sky-900/50 px-2 py-0.5 rounded-full">{count}</span>
                            </div>
                        ))
                    ) : (
                        <div className="flex items-center justify-center h-full text-slate-500">
                           <span>{filterMode === 'unrecognized' ? 'Không áp dụng' : 'Không có dữ liệu'}</span>
                        </div>
                    )}
                 </div>
              </div>
          </div>
          
          <div>
            <p className="text-xs text-slate-500 mt-2">
                * Ghi chú: Dòng có <strong>[KHÔNG NHẬN DẠNG ĐƯỢỢC]</strong> là phần văn bản còn sót lại. Bạn có thể sửa trực tiếp, nhấn <strong>Enter</strong> để hệ thống tự động xử lý lại dòng đó.
            </p>
          </div>

          {hiddenData.length > 0 && (
            <div>
                <details className="group">
                    <summary className="text-sm font-medium text-slate-400 cursor-pointer list-none flex items-center gap-2 hover:text-sky-400 transition-colors">
                        <span className="group-open:rotate-90 transition-transform duration-200">▶</span>
                        Các mục đã ẩn ({hiddenData.length})
                    </summary>
                    <div className="mt-2 w-full bg-slate-900 border border-slate-700 rounded-lg p-3 space-y-1 overflow-y-auto font-mono text-sm max-h-48">
                        {hiddenData.map(item => (
                            <p key={item.id} className="text-slate-500">{item.text}</p>
                        ))}
                    </div>
                </details>
            </div>
            )}
        </div>
      )}
    </div>
  );
};

export default OrderProcessor;
