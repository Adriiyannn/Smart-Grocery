import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

const modalStyles = `
  .add-item-modal-backdrop {
    backdrop-filter: blur(4px);
    -webkit-backdrop-filter: blur(4px);
  }
  
  /* Force black text on all input types */
  .modal-input {
    color: #000000 !important;
    caret-color: #000000 !important;
    background-color: white !important;
  }
  
  .modal-input::-webkit-selection {
    background-color: rgba(59, 130, 246, 0.3) !important;
    color: #000000 !important;
  }
  
  .modal-input::selection {
    background-color: rgba(59, 130, 246, 0.3) !important;
    color: #000000 !important;
  }
  
  .modal-input::-moz-selection {
    background-color: rgba(59, 130, 246, 0.3) !important;
    color: #000000 !important;
  }
  
  .modal-input::-webkit-outer-spin-button,
  .modal-input::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }
  
  .modal-input[type="number"] {
    -moz-appearance: textfield;
  }
  
  /* Autofill styling */
  .modal-input:-webkit-autofill {
    -webkit-box-shadow: 0 0 0 1000px white inset !important;
    -webkit-text-fill-color: #000000 !important;
  }
  
  .modal-input:-webkit-autofill:focus {
    -webkit-box-shadow: 0 0 0 1000px white inset !important;
    -webkit-text-fill-color: #000000 !important;
  }
  
  .modal-input:focus {
    color: #000000 !important;
    background-color: white !important;
  }
  
  .modal-input::placeholder {
    color: #9CA3AF !important;
    opacity: 1 !important;
  }
  
  /* Force black text on selects */
  .modal-select {
    color: #000000 !important;
    caret-color: #000000 !important;
    background-color: white !important;
  }
  
  .modal-select:-webkit-autofill {
    -webkit-box-shadow: 0 0 0 1000px white inset !important;
    -webkit-text-fill-color: #000000 !important;
  }
  
  .modal-select option {
    color: #000000 !important;
    background-color: white !important;
  }
  
  .modal-select option:checked {
    color: #000000 !important;
    background: linear-gradient(#3B82F6, #3B82F6) !important;
  }
  
  /* Force black text on textareas */
  .modal-textarea {
    color: #000000 !important;
    caret-color: #000000 !important;
    background-color: white !important;
  }
  
  .modal-textarea::-webkit-selection {
    background-color: rgba(59, 130, 246, 0.3) !important;
    color: #000000 !important;
  }
  
  .modal-textarea::selection {
    background-color: rgba(59, 130, 246, 0.3) !important;
    color: #000000 !important;
  }
  
  .modal-textarea::placeholder {
    color: #9CA3AF !important;
    opacity: 1 !important;
  }
  
  .modal-textarea:focus {
    color: #000000 !important;
    background-color: white !important;
  }
`;

export default function AddItemModal({ isOpen, onClose, onSubmit, editingItem, loading, categories }) {
  const [formData, setFormData] = useState({
    productName: '',
    category: 'Other',
    quantity: 1,
    unitType: 'unit',
    estimatedPrice: '',
    notes: '',
  });

  const unitTypes = ['unit', 'kg', 'lb', 'liter', 'ml', 'cup', 'tbsp', 'tsp', 'oz', 'piece', 'pack', 'bottle', 'box'];

  useEffect(() => {
    if (editingItem) {
      setFormData({
        productName: editingItem.product_name,
        category: editingItem.category,
        quantity: editingItem.quantity,
        unitType: editingItem.unit_type,
        estimatedPrice: editingItem.estimated_price || '',
        notes: editingItem.notes || '',
      });
    } else {
      setFormData({
        productName: '',
        category: 'Other',
        quantity: 1,
        unitType: 'unit',
        estimatedPrice: '',
        notes: '',
      });
    }
  }, [isOpen, editingItem]);

  // Force text color to black on all inputs
  useEffect(() => {
    if (!isOpen) return;

    const inputs = document.querySelectorAll('.modal-input, .modal-select, .modal-textarea');
    
    const forceBlackText = () => {
      inputs.forEach((input) => {
        input.style.color = '#000000';
        input.style.backgroundColor = '#ffffff';
        input.style.caretColor = '#000000';
        
        // Force selection styling
        const style = input.getAttribute('style') || '';
        if (!style.includes('--text-color')) {
          input.setAttribute('style', `${style}; --text-color: #000000;`);
        }
      });
    };

    forceBlackText();
    
    // Run periodically to ensure persistence
    const interval = setInterval(forceBlackText, 100);
    
    // Also watch for input changes
    inputs.forEach((input) => {
      input.addEventListener('input', forceBlackText);
      input.addEventListener('change', forceBlackText);
      input.addEventListener('focus', forceBlackText);
      input.addEventListener('blur', forceBlackText);
    });

    return () => {
      clearInterval(interval);
      inputs.forEach((input) => {
        input.removeEventListener('input', forceBlackText);
        input.removeEventListener('change', forceBlackText);
        input.removeEventListener('focus', forceBlackText);
        input.removeEventListener('blur', forceBlackText);
      });
    };
  }, [isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'quantity' ? parseInt(value) || 0 : value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.productName.trim()) {
      alert('Please enter a product name');
      return;
    }

    if (formData.quantity <= 0) {
      alert('Quantity must be greater than 0');
      return;
    }

    onSubmit(formData);
  };

  if (!isOpen) return null;

  return (
    <>
      <style>{modalStyles}</style>
      <div className="add-item-modal-backdrop fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">
            {editingItem ? 'Edit Item' : 'Add Item to List'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 p-1"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Product Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Product Name *
            </label>
            <input
              type="text"
              name="productName"
              value={formData.productName}
              onChange={handleChange}
              placeholder="e.g., Milk, Bread, Apples"
              style={{
                color: '#000000',
                backgroundColor: '#ffffff',
                caretColor: '#000000',
              }}
              className="modal-input w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category *
            </label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              style={{
                color: '#000000',
                backgroundColor: '#ffffff',
              }}
              className="modal-select w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Quantity */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Quantity *
            </label>
            <input
              type="number"
              name="quantity"
              value={formData.quantity}
              onChange={handleChange}
              min="1"
              style={{
                color: '#000000',
                backgroundColor: '#ffffff',
                caretColor: '#000000',
              }}
              className="modal-input w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Unit Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Unit Type *
            </label>
            <select
              name="unitType"
              value={formData.unitType}
              onChange={handleChange}
              style={{
                color: '#000000',
                backgroundColor: '#ffffff',
              }}
              className="modal-select w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {unitTypes.map((unit) => (
                <option key={unit} value={unit}>
                  {unit}
                </option>
              ))}
            </select>
          </div>

          {/* Estimated Price */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Estimated Price (Optional)
            </label>
            <div className="flex items-center">
              <span className="text-gray-500 mr-2">$</span>
              <input
                type="number"
                name="estimatedPrice"
                value={formData.estimatedPrice}
                onChange={handleChange}
                step="0.01"
                min="0"
                placeholder="0.00"
                style={{
                  color: '#000000',
                  backgroundColor: '#ffffff',
                  caretColor: '#000000',
                }}
                className="modal-input w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes (Optional)
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              placeholder="e.g., Brand preference, specific store location"
              rows="2"
              style={{
                color: '#000000',
                backgroundColor: '#ffffff',
                caretColor: '#000000',
              }}
              className="modal-textarea w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition duration-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition duration-200"
            >
              {loading ? 'Saving...' : editingItem ? 'Update Item' : 'Add Item'}
            </button>
          </div>
        </form>
      </div>
      </div>
    </>
  );
}
