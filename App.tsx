
import React, { useState, useCallback } from 'react';
import type { Product } from './types';
import ProductListItem from './components/ProductListItem';
import OrderProcessor from './components/OrderProcessor';
import { PlusIcon } from './components/icons';

const DEFAULT_PRODUCTS: Product[] = [
    { id: crypto.randomUUID(), name: 'Bình Giữ Nhiệt Fan Cứng Mixi' },
    { id: crypto.randomUUID(), name: 'Bình giữ nhiệt Mixi - Trắng' },
    { id: crypto.randomUUID(), name: 'Bình giữ nhiệt Mixi - Hồng' },
    { id: crypto.randomUUID(), name: 'Bình giữ nhiệt Mixi - Đen' },
    { id: crypto.randomUUID(), name: 'Cốc Mixi 1200ml - Trắng' },
    { id: crypto.randomUUID(), name: 'Cốc Mixi 1200ml - Đen' },
    { id: crypto.randomUUID(), name: 'Cốc Mixi 1200ml - Đen quai hồng' },
    { id: crypto.randomUUID(), name: 'Cốc Mixi 1200ml - Hồng quai đen' },
    { id: crypto.randomUUID(), name: 'Cốc mù' },
    { id: crypto.randomUUID(), name: 'Cốc sticker - Trắng' },
    { id: crypto.randomUUID(), name: 'Cốc sticker - Đen' },
    { id: crypto.randomUUID(), name: 'Cốc sticker - Đen quai hồng' },
    { id: crypto.randomUUID(), name: 'Cốc sticker - Hồng quai đen' },
    { id: crypto.randomUUID(), name: 'Cốc vịt - Đen' },
    { id: crypto.randomUUID(), name: 'Cốc vịt - Trắng' },
    { id: crypto.randomUUID(), name: 'Cốc Vịt - Đen quai hồng' },
    { id: crypto.randomUUID(), name: 'Cốc Vịt - Hồng quai đen' },
    { id: crypto.randomUUID(), name: 'Đầu bịt' },
    { id: crypto.randomUUID(), name: 'Nắp hồng' },
    { id: crypto.randomUUID(), name: 'Nắp đen' },
    { id: crypto.randomUUID(), name: 'Nắp trắng' },
    { id: crypto.randomUUID(), name: 'Ống hút hồng' },
    { id: crypto.randomUUID(), name: 'Ống hút trắng' },
    { id: crypto.randomUUID(), name: 'Ống hút đen' },
    { id: crypto.randomUUID(), name: 'Combo hồng' },
    { id: crypto.randomUUID(), name: 'Combo đen' },
    { id: crypto.randomUUID(), name: 'Combo trắng' },
    { id: crypto.randomUUID(), name: 'Bộ Ghép Hình Mixi – Mixi Block SS1' },
    { id: crypto.randomUUID(), name: 'Bộ Ghép Hình Mixi – Mixi Block SS2' },
    { id: crypto.randomUUID(), name: 'Bộ Ghép Hình Mixi – Mixi Block SS3' },
    { id: crypto.randomUUID(), name: 'Bộ Ghép Hình Mixi – Mixi Block SS4' },
    { id: crypto.randomUUID(), name: 'Bộ Ghép Hình Mixi – Mixi Block SS5' },
    { id: crypto.randomUUID(), name: 'Bộ Ghép Hình Mixi – Mixi Block SS6' },
    { id: crypto.randomUUID(), name: 'Bộ Ghép Hình Mixi – Mixi Block SS7' },
    { id: crypto.randomUUID(), name: 'Bộ Ghép Hình Mixi – Mixi Block SS8' },
    { id: crypto.randomUUID(), name: 'Bộ Ghép Hình Mixi – Mixi Block SS9' },
    { id: crypto.randomUUID(), name: 'Áo hoodie Mixi classic màu đen' },
    { id: crypto.randomUUID(), name: 'Áo hoodie Mixi đen khoá ngực' },
    { id: crypto.randomUUID(), name: 'Áo khoác Mixi đen' },
    { id: crypto.randomUUID(), name: 'Áo khoác nỉ' },
    { id: crypto.randomUUID(), name: 'Áo nỉ dài tay 01' },
    { id: crypto.randomUUID(), name: 'Áo nỉ dài tay 02' },
    { id: crypto.randomUUID(), name: 'Áo nỉ dài tay Mixi - Trắng' },
    { id: crypto.randomUUID(), name: 'Áo nỉ dài tay Mixi - Đen' },
    { id: crypto.randomUUID(), name: 'Áo nỉ dài tay MXG – Đen' },
    { id: crypto.randomUUID(), name: 'Áo 3 lỗ Mixi (mặt logo Mixi)' },
    { id: crypto.randomUUID(), name: 'Áo 3 Lỗ Mixi – BL01' },
    { id: crypto.randomUUID(), name: 'Áo 3 Lỗ Mixi – BL02' },
    { id: crypto.randomUUID(), name: 'Áo 3 Lỗ Mixi – BL03' },
    { id: crypto.randomUUID(), name: 'Áo 3 Lỗ Mixi – BL04' },
    { id: crypto.randomUUID(), name: 'Áo 3 Lỗ Mixi – BL05' },
    { id: crypto.randomUUID(), name: 'Áo 3 Lỗ Mixi – BL06' },
    { id: crypto.randomUUID(), name: 'Áo logo 2023 - Đen' },
    { id: crypto.randomUUID(), name: 'Áo logo 2023 - Trắng' },
    { id: crypto.randomUUID(), name: 'Áo phông Mixi – Phòng Stream' },
    { id: crypto.randomUUID(), name: 'Áo phông Mixi – Tộc Trưởng' },
    { id: crypto.randomUUID(), name: 'Áo phông Mixi – Trắng' },
    { id: crypto.randomUUID(), name: 'Áo phông Mixi FMWL – Đen' },
    { id: crypto.randomUUID(), name: 'Áo phông Mixi logo – Đen' },
    { id: crypto.randomUUID(), name: 'Áo phông MXG logo chữ – Đen' },
    { id: crypto.randomUUID(), name: 'Áo phông MXG logo hình – Đen' },
    { id: crypto.randomUUID(), name: 'Áo phông MXG logo hình – Trắng' },
    { id: crypto.randomUUID(), name: 'Áo phông P502' },
    { id: crypto.randomUUID(), name: 'Áo phông P504' },
    { id: crypto.randomUUID(), name: 'Áo Sologan MixiGaming 2024' },
    { id: crypto.randomUUID(), name: 'Bộ quần áo Mixi nỉ da cá 01 (logo trắng)' },
    { id: crypto.randomUUID(), name: 'Bộ quần áo Mixi nỉ da cá 02 (logo đỏ)' },
    { id: crypto.randomUUID(), name: 'Quần đùi nỉ 01' },
    { id: crypto.randomUUID(), name: 'Quần đùi nỉ 02' },
    { id: crypto.randomUUID(), name: 'Móc vịt' },
    { id: crypto.randomUUID(), name: 'Móc vịt SS2' },
    { id: crypto.randomUUID(), name: 'Pad chuột MixiGaming' },
    { id: crypto.randomUUID(), name: 'Pad chuột MixiGaming Mã 02' },
    { id: crypto.randomUUID(), name: 'Vịt page2k' },
    { id: crypto.randomUUID(), name: 'Dép MixiGaming 2024' },
];

const App: React.FC = () => {
  const [products, setProducts] = useState<Product[]>(DEFAULT_PRODUCTS);
  const [newProductName, setNewProductName] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'process' | 'manage'>('process');

  const handleAddProduct = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (newProductName.trim()) {
      setProducts(prevProducts => [
        { id: crypto.randomUUID(), name: newProductName.trim() },
        ...prevProducts,
      ]);
      setNewProductName('');
    }
  }, [newProductName]);

  const handleUpdateProduct = useCallback((id: string, newName: string) => {
    setProducts(prevProducts =>
      prevProducts.map(p => (p.id === id ? { ...p, name: newName } : p))
    );
  }, []);

  const handleDeleteProduct = useCallback((id: string) => {
    setProducts(prevProducts => prevProducts.filter(p => p.id !== id));
  }, []);
  
  const TabButton = ({
    label,
    tabName,
  }: {
    label: string;
    tabName: 'process' | 'manage';
  }) => (
    <button
      onClick={() => setActiveTab(tabName)}
      className={`px-4 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
        activeTab === tabName
          ? 'bg-sky-600 text-white'
          : 'text-slate-300 hover:bg-slate-700/50'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans p-4 sm:p-6 md:p-8">
      <div className="max-w-screen-2xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-cyan-300">
            Công cụ hỗ trợ MixiShop
          </h1>
          <p className="mt-2 text-slate-400">Xử lý đơn hàng và quản lý sản phẩm.</p>
        </header>
        
        <div className="flex justify-center mb-6">
          <div className="flex space-x-2 bg-slate-800 p-1 rounded-lg">
            <TabButton label="Xử lý đơn hàng" tabName="process" />
            <TabButton label="Quản lý sản phẩm" tabName="manage" />
          </div>
        </div>

        <main>
          {activeTab === 'process' && <OrderProcessor products={products} />}

          {activeTab === 'manage' && (
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 p-6 rounded-xl shadow-lg">
              <h2 className="text-xl font-bold text-sky-400 mb-4">Danh sách sản phẩm</h2>
              
              <form onSubmit={handleAddProduct} className="flex gap-3 mb-6">
                <input
                  type="text"
                  value={newProductName}
                  onChange={(e) => setNewProductName(e.target.value)}
                  placeholder="Thêm sản phẩm mới..."
                  className="flex-grow bg-slate-900 border border-slate-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-200 placeholder-slate-500"
                />
                <button
                  type="submit"
                  className="flex-shrink-0 flex items-center justify-center w-10 h-10 bg-sky-600 text-white font-semibold rounded-lg hover:bg-sky-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-sky-500 transition-colors duration-200 disabled:bg-slate-600"
                  disabled={!newProductName.trim()}
                  aria-label="Thêm sản phẩm"
                >
                  <PlusIcon />
                </button>
              </form>

              {products.length > 0 ? (
                <ul className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
                  {products.map(product => (
                    <ProductListItem
                      key={product.id}
                      product={product}
                      onUpdate={handleUpdateProduct}
                      onDelete={handleDeleteProduct}
                    />
                  ))}
                </ul>
              ) : (
                <div className="text-center py-10 border-2 border-dashed border-slate-700 rounded-lg">
                  <p className="text-slate-500">Chưa có sản phẩm nào.</p>
                  <p className="text-slate-500 text-sm">
                    Hãy thêm một sản phẩm mới ở trên.
                  </p>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default App;
