/**
 * OnixClient APPX File Fetcher with Auto-Update
 * Fetches all Minecraft Bedrock compatible APPX files from the OnixClient repository
 * and automatically updates at specified intervals
 */

class OnixAppxFetcher {
  constructor(options = {}) {
    this.repoOwner = 'OnixClient';
    this.repoName = 'onix_compatible_appx';
    this.rawContentUrl = `https://raw.githubusercontent.com/${this.repoOwner}/${this.repoName}/main/versions.json`;
    
    // Configuration options
    this.updateInterval = options.updateInterval || 3600000; // Default: 1 hour
    this.autoUpdate = options.autoUpdate !== false; // Default: true
    this.onUpdate = options.onUpdate || null; // Callback function for updates
    this.onError = options.onError || null; // Callback function for errors
    
    // State
    this.versions = [];
    this.lastUpdated = null;
    this.updateTimer = null;
    this.isUpdating = false;
  }

  /**
   * Fetch the versions.json file from the repository
   * @returns {Promise<Array>} Array of version objects
   */
  async fetchVersions() {
    if (this.isUpdating) {
      console.warn('Update already in progress...');
      return this.versions;
    }

    this.isUpdating = true;

    try {
      console.log('Fetching Onix APPX versions...');
      const response = await fetch(this.rawContentUrl);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // Validate data structure
      if (!Array.isArray(data)) {
        throw new Error('Invalid data structure: expected array of versions');
      }

      this.versions = data;
      this.lastUpdated = new Date();

      console.log(`Successfully fetched ${this.versions.length} versions`);
      console.log(`Last updated: ${this.lastUpdated.toLocaleString()}`);

      // Call update callback if provided
      if (this.onUpdate && typeof this.onUpdate === 'function') {
        this.onUpdate(this.versions, this.lastUpdated);
      }

      return this.versions;
    } catch (error) {
      console.error('Error fetching versions:', error.message);

      // Call error callback if provided
      if (this.onError && typeof this.onError === 'function') {
        this.onError(error);
      }

      throw error;
    } finally {
      this.isUpdating = false;
    }
  }

  /**
   * Start auto-updating at specified intervals
   */
  startAutoUpdate() {
    if (this.autoUpdate && !this.updateTimer) {
      console.log(`Starting auto-update every ${this.updateInterval}ms`);
      
      // Initial fetch
      this.fetchVersions().catch(err => {
        console.error('Initial fetch failed:', err);
      });

      // Set up interval
      this.updateTimer = setInterval(() => {
        this.fetchVersions().catch(err => {
          console.error('Scheduled update failed:', err);
        });
      }, this.updateInterval);
    }
  }

  /**
   * Stop auto-updating
   */
  stopAutoUpdate() {
    if (this.updateTimer) {
      clearInterval(this.updateTimer);
      this.updateTimer = null;
      console.log('Auto-update stopped');
    }
  }

  /**
   * Get all versions
   * @returns {Array} Array of version objects
   */
  getVersions() {
    return this.versions;
  }

  /**
   * Get a specific version by version number
   * @param {String} version - Version number (e.g., "1.26.0")
   * @returns {Object|null} Version object or null if not found
   */
  getVersion(version) {
    return this.versions.find(v => v.version === version) || null;
  }

  /**
   * Get the latest version
   * @returns {Object|null} Latest version object or null if no versions
   */
  getLatestVersion() {
    return this.versions.length > 0 ? this.versions[0] : null;
  }

  /**
   * Filter versions by criteria
   * @param {Function} filterFn - Filter function
   * @returns {Array} Filtered versions
   */
  filterVersions(filterFn) {
    return this.versions.filter(filterFn);
  }

  /**
   * Get all APPX file URLs
   * @returns {Array} Array of download URLs
   */
  getAllDownloadUrls() {
    return this.versions.map(v => ({
      version: v.version,
      url: v.url
    }));
  }

  /**
   * Get version statistics
   * @returns {Object} Stats object
   */
  getStats() {
    return {
      totalVersions: this.versions.length,
      lastUpdated: this.lastUpdated,
      latestVersion: this.getLatestVersion()?.version || 'N/A',
      oldestVersion: this.versions.length > 0 ? 
        this.versions[this.versions.length - 1].version : 'N/A'
    };
  }

  /**
   * Export versions to JSON string
   * @returns {String} JSON string of versions
   */
  exportToJSON() {
    return JSON.stringify(this.versions, null, 2);
  }

  /**
   * Destroy the fetcher and cleanup
   */
  destroy() {
    this.stopAutoUpdate();
    this.versions = [];
    this.lastUpdated = null;
  }
}

// Export for use in Node.js or as ES6 module
if (typeof module !== 'undefined' && module.exports) {
  module.exports = OnixAppxFetcher;
}