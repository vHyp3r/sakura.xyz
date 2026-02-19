// Example 1: Basic usage with auto-update
const fetcher = new OnixAppxFetcher({
  updateInterval: 3600000, // Update every hour
  onUpdate: (versions, lastUpdated) => {
    console.log(`Updated with ${versions.length} versions at ${lastUpdated}`);
  },
  onError: (error) => {
    console.error('Update failed:', error);
  }
});

// Start fetching
fetcher.startAutoUpdate();

// Get latest version
const latest = fetcher.getLatestVersion();
console.log('Latest version:', latest);

// Get all download URLs
const urls = fetcher.getAllDownloadUrls();
console.log('All URLs:', urls);


// Example 2: One-time fetch without auto-update
const fetcher2 = new OnixAppxFetcher({ autoUpdate: false });
fetcher2.fetchVersions()
  .then(versions => {
    console.log(`Fetched ${versions.length} versions`);
    versions.forEach(v => {
      console.log(`${v.version}: ${v.url}`);
    });
  })
  .catch(error => console.error('Failed to fetch:', error));


// Example 3: Filter specific versions
const fetcher3 = new OnixAppxFetcher();
fetcher3.fetchVersions().then(() => {
  // Get all versions from 1.20.x
  const v120Versions = fetcher3.filterVersions(v => v.version.startsWith('1.20'));
  console.log('1.20.x versions:', v120Versions);
  
  // Get versions with MSIXVC extension
  const msixvcVersions = fetcher3.filterVersions(v => v.url.includes('msixvc'));
  console.log('MSIXVC versions:', msixvcVersions);
});


// Example 4: Display statistics
const fetcher4 = new OnixAppxFetcher({ autoUpdate: true });
fetcher4.startAutoUpdate();

setInterval(() => {
  const stats = fetcher4.getStats();
  console.log('Repository Stats:');
  console.log(`  Total Versions: ${stats.totalVersions}`);
  console.log(`  Latest: ${stats.latestVersion}`);
  console.log(`  Oldest: ${stats.oldestVersion}`);
  console.log(`  Last Updated: ${stats.lastUpdated}`);
}, 300000); // Log stats every 5 minutes


// Example 5: Download a specific version (pseudo-code)
async function downloadVersion(versionNumber) {
  const fetcher = new OnixAppxFetcher({ autoUpdate: false });
  await fetcher.fetchVersions();
  
  const version = fetcher.getVersion(versionNumber);
  if (version) {
    console.log(`Downloading ${version.version} from ${version.url}`);
    // Use your download logic here
  } else {
    console.log('Version not found');
  }
}


// Example 6: Stop auto-update when done
setTimeout(() => {
  fetcher.stopAutoUpdate();
  fetcher.destroy();
}, 3600000); // Stop after 1 hour