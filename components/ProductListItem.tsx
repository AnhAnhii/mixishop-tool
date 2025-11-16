
import React, { useState, useRef, useEffect } from 'react';
import type { Product } from '../types';
import { EditIcon, DeleteIcon, SaveIcon, CancelIcon } from './icons';

interface ProductListItemProps {
  product: Product;
  onUpdate: (id: string, newName: string) => void;
  onDelete: (id: string) => void;
}

const ProductListItem: React.FC<ProductListItemProps> = ({ product, onUpdate, onDelete }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(product.name);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  const handleSave = () => {
    if (editedName.trim() && editedName.trim() !== product.name) {
      onUpdate(product.id, editedName.trim());
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedName(product.name);
    setIsEditing(false);
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
        handleSave();
    } else if (e.key === 'Escape') {
        handleCancel();
    }
  };

  return (
    <li className="flex items-center justify-between bg-slate-800 p-3 rounded-lg shadow-md hover:bg-slate-700/50 transition-colors duration-200">
      {isEditing ? (
        <input
          ref={inputRef}
          type="text"
          value={editedName}
          onChange={(e) => setEditedName(e.target.value)}
          onKeyDown={handleKeyDown}
          className="bg-slate-900 text-white flex-grow mr-3 py-1 px-2 border border-sky-500 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-400"
        />
      ) : (
        <span className="text-slate-200 flex-grow mr-3 truncate">{product.name}</span>
      )}
      <div className="flex-shrink-0 flex items-center space-x-2">
        {isEditing ? (
          <>
            <button
              onClick={handleSave}
              className="p-2 rounded-full text-green-400 hover:bg-green-500/20 transition-colors duration-200"
              aria-label="Lưu"
            >
              <SaveIcon />
            </button>
            <button
              onClick={handleCancel}
              className="p-2 rounded-full text-slate-400 hover:bg-slate-500/20 transition-colors duration-200"
              aria-label="Hủy"
            >
              <CancelIcon />
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => setIsEditing(true)}
              className="p-2 rounded-full text-sky-400 hover:bg-sky-500/20 transition-colors duration-200"
              aria-label="Sửa"
            >
              <EditIcon />
            </button>
            <button
              onClick={() => onDelete(product.id)}
              className="p-2 rounded-full text-red-400 hover:bg-red-500/20 transition-colors duration-200"
              aria-label="Xóa"
            >
              <DeleteIcon />
            </button>
          </>
        )}
      </div>
    </li>
  );
};

export default ProductListItem;