
import React, { useState, useEffect } from 'react';
import { Log } from '../../logging_middleware/log';


const App = () => {
  const [urls, setUrls] = useState([]);
  const [inputUrl, setInputUrl] = useState('');
  const [customShortcode, setCustomShortcode] = useState('');
  const [validity, setValidity] = useState(30);
  const [activeTab, setActiveTab] = useState('shorten');


  useEffect(() => {
    const savedUrls = JSON.parse(localStorage.getItem('shortenedUrls') || '[]');
    setUrls(savedUrls);
    Log('frontend', 'info', 'url-shortener', 'Application initialized');

  }, []);


  useEffect(() => {
    localStorage.setItem('shortenedUrls', JSON.stringify(urls));
  }, [urls]);


  const generateShortcode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const isValidUrl = (url) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };


  const isUniqueShortcode = (shortcode) => {
    return !urls.some(url => url.shortcode === shortcode);
  };


  const handleShorten = async () => {
    if (!inputUrl.trim()) {
      await Log('frontend', 'warn', 'url-shortener', 'URL shortening attempted with empty input');
      alert('Please enter a URL to shorten');
      return;
    }

    if (!isValidUrl(inputUrl)) {
      await Log('frontend', 'warn', 'url-shortener', `Invalid URL format: ${inputUrl}`);
      alert('Please enter a valid URL');
      return;
    }

    let shortcode = customShortcode.trim();
    
    if (shortcode) {
      if (!isUniqueShortcode(shortcode)) {
        await Log('frontend', 'warn', 'url-shortener', `Duplicate shortcode attempted: ${shortcode}`);
        alert('This shortcode is already taken. Please choose another one.');
        return;
      }
      if (!/^[a-zA-Z0-9]+$/.test(shortcode)) {
        await Log('frontend', 'warn', 'url-shortener', `Invalid shortcode format: ${shortcode}`);
        alert('Shortcode can only contain letters and numbers');
        return;
      }
    } else {
      
      do {
        shortcode = generateShortcode();
      } while (!isUniqueShortcode(shortcode));
    }

    const newUrl = {
      id: Date.now(),
      originalUrl: inputUrl,
      shortcode,
      shortUrl: `${window.location.origin}/${shortcode}`,
      createdAt: new Date().toISOString(),
      validityMinutes: validity,
      expiresAt: new Date(Date.now() + validity * 60 * 1000).toISOString(),
      clicks: 0
    };

    setUrls(prev => [newUrl, ...prev]);
    setInputUrl('');
    setCustomShortcode('');
    setValidity(30);
    
    
    await Log('frontend', 'info', 'url-shortener', `URL shortened: ${inputUrl} -> ${shortcode} (expires in ${validity} minutes)`);
  };

  
  const handleRedirect = async (url) => {
    const now = new Date();
    const expiresAt = new Date(url.expiresAt);
    
    if (now > expiresAt) {
       await Log('frontend', 'warn', 'url-shortener', `Access attempted to expired URL: ${url.shortcode}`);
      alert('This shortened URL has expired');
      return;
    }

    
    setUrls(prev => 
      prev.map(u => 
        u.id === url.id 
          ? { ...u, clicks: u.clicks + 1 }
          : u
      )
    );

    
    await Log('frontend', 'info', 'url-shortener', `URL redirect: ${url.shortcode} -> ${url.originalUrl} (click #${url.clicks + 1})`);
    
    
    window.open(url.originalUrl, '_blank');
  };

  
  const deleteUrl = async (id) => {
    const urlToDelete = urls.find(url => url.id === id);
    setUrls(prev => prev.filter(url => url.id !== id));
    
    if (urlToDelete) {
      await Log('frontend', 'info', 'url-shortener', `URL deleted: ${urlToDelete.shortcode} (${urlToDelete.originalUrl})`);
    }
  };

  
  const getAnalytics = () => {
    const totalUrls = urls.length;
    const totalClicks = urls.reduce((sum, url) => sum + url.clicks, 0);
    const activeUrls = urls.filter(url => new Date() < new Date(url.expiresAt)).length;
    const expiredUrls = totalUrls - activeUrls;

    return { totalUrls, totalClicks, activeUrls, expiredUrls };
  };

  const analytics = getAnalytics();

  return (
    <>

      <div className="app">
      <header className="header">
        <h1>URL Shortener</h1>
      </header>

      <nav className="nav">
        <button 
          className={`nav-btn ${activeTab === 'shorten' ? 'active' : ''}`}
          onClick={() => {setActiveTab('shorten'); Log('frontend', 'info', 'url-shortener', 'Navigation: Switched to Shorten tab');}}
        >
          Shorten URL
        </button>
        <button 
          className={`nav-btn ${activeTab === 'manage' ? 'active' : ''}`}
          onClick={() => {setActiveTab('manage'); Log('frontend', 'info', 'url-shortener', 'Navigation: Switched to Manage tab');}}
        >
          Manage Links
        </button>
        <button 
          className={`nav-btn ${activeTab === 'analytics' ? 'active' : ''}`}
          onClick={() => {setActiveTab('analytics'); Log('frontend', 'info', 'url-shortener', 'Navigation: Switched Statistics tab');}}
        >
          Statistics
        </button>
      </nav>
      <main className="main">
        {activeTab === 'shorten' && (
          <div className="shorten-section">
            <div className="input-group">
              <label htmlFor="url-input">Enter URL to shorten:</label>
              <input
                id="url-input"
                type="url"
                value={inputUrl}
                onChange={(e) => setInputUrl(e.target.value)}
                placeholder="https://example.com/very-long-url"
                className="url-input"
              />
            </div>

            <div className="input-group">
              <label htmlFor="shortcode-input">Custom shortcode (optional):</label>
              <input
                id="shortcode-input"
                type="text"
                value={customShortcode}
                onChange={(e) => setCustomShortcode(e.target.value)}
                placeholder="mylink"
                className="shortcode-input"
              />
            </div>

            <div className="input-group">
              <label htmlFor="validity-input">Validity (minutes):</label>
              <input
                id="validity-input"
                type="number"
                value={validity}
                onChange={(e) => setValidity(Math.max(1, parseInt(e.target.value) || 30))}
                min="1"
                className="validity-input"
              />
            </div>

            <button onClick={handleShorten} className="shorten-btn">
              Shorten URL
            </button>
          </div>
        )}

        {activeTab === 'manage' && (
          <div className="manage-section">
            <h2>Your Shortened URLs</h2>
            {urls.length === 0 ? (
              <p className="no-urls">No URLs shortened yet. Create your first short link!</p>
            ) : (
              <div className="url-list">
                {urls.map(url => {
                  const isExpired = new Date() > new Date(url.expiresAt);
                  return (
                    <div key={url.id} className={`url-card ${isExpired ? 'expired' : ''}`}>
                      <div className="url-info">
                        <div className="url-row">
                          <strong>Short URL:</strong>
                          <span 
                            className="short-url"
                            onClick={() => !isExpired && handleRedirect(url)}
                          >
                            {url.shortUrl}
                          </span>
                        </div>
                        <div className="url-row">
                          <strong>Original:</strong>
                          <span className="original-url">{url.originalUrl}</span>
                        </div>
                        <div className="url-meta">
                          <span>Created: {new Date(url.createdAt).toLocaleString()}</span>
                          <span>Clicks: {url.clicks}</span>
                          <span className={isExpired ? 'expired-text' : ''}>
                            {isExpired ? 'Expired' : `Expires: ${new Date(url.expiresAt).toLocaleString()}`}
                          </span>
                        </div>
                      </div>
                      <button 
                        onClick={() => deleteUrl(url.id)}
                        className="delete-btn"
                      >
                        Delete
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="analytics-section">
            <h2>Analytics Dashboard</h2>
            <div className="analytics-grid">
              <div className="analytics-card">
                <h3>Total URLs</h3>
                <div className="analytics-number">{analytics.totalUrls}</div>
              </div>
              <div className="analytics-card">
                <h3>Total Clicks</h3>
                <div className="analytics-number">{analytics.totalClicks}</div>
              </div>
              <div className="analytics-card">
                <h3>Active URLs</h3>
                <div className="analytics-number">{analytics.activeUrls}</div>
              </div>
              <div className="analytics-card">
                <h3>Expired URLs</h3>
                <div className="analytics-number">{analytics.expiredUrls}</div>
              </div>
            </div>
            
            {urls.length > 0 && (
              <div className="top-links">
                <h3>Top Performing Links</h3>
                <div className="top-links-list">
                  {urls
                    .sort((a, b) => b.clicks - a.clicks)
                    .slice(0, 5)
                    .map(url => (
                      <div key={url.id} className="top-link-item">
                        <span className="link-shortcode">{url.shortcode}</span>
                        <span className="link-clicks">{url.clicks} clicks</span>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
          
        )}
        </main>
      

      
    </div>
    </>
  );
};

export default App;