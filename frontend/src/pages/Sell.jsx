import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout/Layout';
import Button from '../components/UI/Button';
import Input from '../components/UI/Input';
import Card, { CardBody } from '../components/UI/Card';
import { AuthContext } from '../context/AuthContext';
import { createBook } from '../services/api';

const Sell = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    category: 'Textbooks',
    condition: 'Used',
    stock: '1',
    imageUrls: [''],
  });
  const [previewErrors, setPreviewErrors] = useState({});
  const [loading, setLoading] = useState(false);

  // Improved Google Drive URL converter
  const normalizeDriveUrl = (url) => {
    if (!url || url.trim() === '') return '';
    
    const trimmedUrl = url.trim();
    
    // Extract file ID from various Google Drive URL formats
    const patterns = [
      /\/d\/([a-zA-Z0-9_-]+)/,                    // /d/FILE_ID
      /id=([a-zA-Z0-9_-]+)/,                       // id=FILE_ID
      /\/file\/d\/([a-zA-Z0-9_-]+)/,               // /file/d/FILE_ID
      /uc\?.*id=([a-zA-Z0-9_-]+)/,                // uc?id=FILE_ID
      /open\?id=([a-zA-Z0-9_-]+)/,                // open?id=FILE_ID
      /drive\.google\.com.*[\/&]([a-zA-Z0-9_-]{25,})/ // Generic pattern for Drive IDs
    ];
    
    let fileId = null;
    for (const pattern of patterns) {
      const match = trimmedUrl.match(pattern);
      if (match && match[1]) {
        fileId = match[1];
        break;
      }
    }
    
    if (fileId) {
      // Use the most reliable URL for images
      // lh3.googleusercontent.com is Google's image CDN - best for hotlinking
      return `https://lh3.googleusercontent.com/d/${fileId}`;
    }
    
    // If not a Google Drive link, return the original URL
    return trimmedUrl;
  };

  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) { 
      navigate('/signin'); 
      return; 
    }
    
    // Validate image URLs before submission
    const validImageUrls = formData.imageUrls
      .map(url => url.trim())
      .filter(url => url !== '')
      .map(normalizeDriveUrl)
      .filter(url => url !== '');
    
    if (validImageUrls.length === 0) {
      setError('Please provide at least one valid image URL');
      return;
    }
    
    setError('');
    setLoading(true);
    
    try {
      const fd = new FormData();
      Object.entries(formData).forEach(([k, v]) => {
        if (k === 'imageUrls') return;
        fd.append(k, v);
      });
      
      validImageUrls.forEach((url) => fd.append('imageUrls', url));
      await createBook(fd);
      navigate('/marketplace');
    } catch (err) {
      setError(err.message || 'Failed to create listing.');
    } finally {
      setLoading(false);
    }
  };

  // Function to check if URL is a Google Drive link
  const isGoogleDriveLink = (url) => {
    return url.includes('drive.google.com') || url.includes('lh3.googleusercontent.com');
  };

  // Get preview URL with fallback
  const getPreviewUrl = (url) => {
    const normalized = normalizeDriveUrl(url);
    if (normalized && isGoogleDriveLink(url)) {
      // Add a cache-buster parameter to avoid cached 403 errors
      return `${normalized}?cache=${Date.now()}`;
    }
    return normalized;
  };

  return (
    <Layout>
      <div className="container-custom py-8 max-w-2xl">
        <h1 className="text-3xl font-bold mb-2">Sell your items</h1>
        <p className="text-gray-600 mb-8">
          Turn your used books and notes into cash.
        </p>

        <Card>
          <CardBody>
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <Input
                label="Title"
                placeholder="e.g., Engineering Mathematics Notes"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  rows="3"
                  placeholder="Describe your item..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <Input
                label="Price (₹)"
                type="number"
                step="0.01"
                placeholder="500"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                required
              />

              <Input
                label="Stock (quantity available)"
                type="number"
                placeholder="1"
                value={formData.stock}
                onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
              />

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                >
                  {['Textbooks', 'Notes', 'Lab Manuals', 'Past Papers', 'Stationery', 'Other'].map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Condition</label>
                <select
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  value={formData.condition}
                  onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
                >
                  <option value="New">New</option>
                  <option value="Used">Used (Good condition)</option>
                  <option value="Used-Fair">Used (Fair condition)</option>
                  <option value="Used-Poor">Used (Poor condition)</option>
                </select>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Image URLs</label>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
                  <p className="text-xs text-blue-800 mb-1">📸 How to share images from Google Drive:</p>
                  <ol className="text-xs text-blue-700 list-decimal list-inside space-y-1">
                    <li>Upload your image to Google Drive</li>
                    <li>Right-click the file and select "Share"</li>
                    <li>Click "General access" and change to "Anyone with the link"</li>
                    <li>Copy the link and paste it below</li>
                    <li>Make sure the file is an image (JPG, PNG, GIF, etc.)</li>
                  </ol>
                </div>
                
                {formData.imageUrls.map((url, index) => {
                  const normalizedUrl = normalizeDriveUrl(url.trim());
                  const hasPreviewError = previewErrors[index];

                  return (
                    <div key={index} className="mb-4">
                      <div className="flex gap-2 mb-2">
                        <input
                          type="url"
                          placeholder="Paste your Google Drive share link here..."
                          className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                          value={url}
                          onChange={(e) => {
                            const urls = [...formData.imageUrls];
                            urls[index] = e.target.value;
                            setFormData({ ...formData, imageUrls: urls });
                            setPreviewErrors((prev) => {
                              const next = { ...prev };
                              delete next[index];
                              return next;
                            });
                          }}
                        />
                        {formData.imageUrls.length > 1 && (
                          <button
                            type="button"
                            className="px-3 py-2 border rounded-lg text-sm text-red-600 hover:bg-red-50"
                            onClick={() => {
                              const urls = [...formData.imageUrls];
                              urls.splice(index, 1);
                              const nextErrors = { ...previewErrors };
                              delete nextErrors[index];
                              setFormData({ ...formData, imageUrls: urls });
                              setPreviewErrors(nextErrors);
                            }}
                          >
                            Remove
                          </button>
                        )}
                      </div>

                      <div className="rounded-lg border border-gray-200 p-3 bg-gray-50">
                        <p className="text-xs text-gray-600 mb-2">Preview</p>
                        {url.trim() ? (
                          <>
                            {!hasPreviewError ? (
                              <div className="relative">
                                <img
                                  src={getPreviewUrl(url)}
                                  alt={`Preview ${index + 1}`}
                                  className="w-full max-h-48 object-contain rounded-md bg-white mb-2"
                                  onError={() => {
                                    setPreviewErrors((prev) => ({ ...prev, [index]: true }));
                                  }}
                                  onLoad={() => {
                                    // Clear error if image loads successfully
                                    if (previewErrors[index]) {
                                      setPreviewErrors((prev) => {
                                        const next = { ...prev };
                                        delete next[index];
                                        return next;
                                      });
                                    }
                                  }}
                                />
                                {isGoogleDriveLink(url) && !hasPreviewError && (
                                  <div className="text-xs text-green-600 mt-1">
                                    ✓ Google Drive image loaded successfully
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="w-full h-48 flex flex-col items-center justify-center rounded-md bg-white border border-dashed border-gray-300 text-sm text-red-600 mb-2">
                                <svg className="w-12 h-12 mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <p className="font-medium">Preview could not load</p>
                                <p className="text-xs mt-1">Make sure:</p>
                                <ul className="text-xs list-disc list-inside mt-1">
                                  <li>The file is shared with "Anyone with the link"</li>
                                  <li>The link is from an actual image file</li>
                                  <li>You've copied the complete URL</li>
                                </ul>
                              </div>
                            )}
                            <div className="text-xs text-blue-600 break-all mt-2">
                              <a href={normalizedUrl} target="_blank" rel="noopener noreferrer">
                                {normalizedUrl}
                              </a>
                            </div>
                          </>
                        ) : (
                          <p className="text-xs text-gray-500">Enter a Google Drive share link to preview your image</p>
                        )}
                      </div>
                    </div>
                  );
                })}
                <button
                  type="button"
                  className="text-primary-600 hover:underline text-sm"
                  onClick={() => setFormData({ ...formData, imageUrls: [...formData.imageUrls, ''] })}
                >
                  + Add another image
                </button>
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Posting listing...' : 'Post listing'}
              </Button>
            </form>
          </CardBody>
        </Card>
      </div>
    </Layout>
  );
};

export default Sell;