import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

const modalStyles = `
  input[type="text"],
  input[type="date"],
  input[type="number"],
  select,
  textarea {
    color: #000000 !important;
    background-color: #ffffff !important;
  }
  
  input[type="text"]::placeholder,
  input[type="date"]::placeholder,
  input[type="number"]::placeholder,
  textarea::placeholder {
    color: #6b7280 !important;
  }
  
  select option {
    color: #000000 !important;
    background-color: #ffffff !important;
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

  // Force text color on inputs
  useEffect(() => {
    if (!isOpen) return;

    const forceInputStyles = () => {
      const inputs = document.querySelectorAll('input, select, textarea');
      inputs.forEach((input) => {
        input.style.color = '#000000';
        input.style.backgroundColor = '#ffffff';
      });
    };

    forceInputStyles();
    const timer = setInterval(forceInputStyles, 50);

    return () => clearInterval(timer);
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
      {/* Backdrop with blur */}
      <div 
        className="fixed inset-0 z-40"
        onClick={onClose}
        style={{
          backgroundColor: 'rgba(0, 0, 0, 0.3)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
        }}
      />
      {/* Modal */}
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4 pointer-events-none">
        <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6 pointer-events-auto">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '700', color: '#111827' }}>
              {editingItem ? 'Edit Item' : 'Add Item to List'}
            </h2>
            <button
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#6b7280',
                padding: '0.25rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#374151')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#6b7280')}
            >
              <X size={24} />
            </button>
          </div>

          <div style={{ display: 'grid', gap: '1rem' }}>
            {/* Product Name */}
            <input
              type="text"
              name="productName"
              value={formData.productName}
              onChange={handleChange}
              placeholder="Product name *"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            {/* Category and Unit Type - Two columns */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Other">Select category</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>

              <select
                name="unitType"
                value={formData.unitType}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="unit">Select unit</option>
                {unitTypes.map((unit) => (
                  <option key={unit} value={unit}>
                    {unit}
                  </option>
                ))}
              </select>
            </div>

            {/* Quantity */}
            <input
              type="number"
              name="quantity"
              value={formData.quantity}
              onChange={handleChange}
              placeholder="Quantity *"
              min="1"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            {/* Estimated Price */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ color: '#6b7280' }}>$</span>
              <input
                type="number"
                name="estimatedPrice"
                value={formData.estimatedPrice}
                onChange={handleChange}
                step="0.01"
                min="0"
                placeholder="0.00"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Notes */}
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              placeholder="Notes (Optional)"
              rows="2"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            {/* Actions */}
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                onClick={onClose}
                className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-900 font-semibold py-2 px-4 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-2 px-4 rounded-lg transition"
              >
                {loading ? 'Saving...' : editingItem ? 'Update Item' : 'Add Item'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
