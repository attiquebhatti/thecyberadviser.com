/**
 * Detector Module
 * Auto-detects the firewall vendor based on configuration syntax
 */

export function detectVendor(configText, filename = '') {
    // Return early if no text
    if (!configText || typeof configText !== 'string') {
        return 'unknown';
    }

    // Grab first ~100 lines for quick detection
    const lines = configText.split('\n').slice(0, 100);
    const contentToScan = lines.join('\n');
    const lowerContent = contentToScan.toLowerCase();
    const lowerFilename = filename.toLowerCase();

    // 1. Fortigate Detection
    if (
        contentToScan.includes('# config-version=') && contentToScan.includes('FG') ||
        contentToScan.includes('config system global') ||
        contentToScan.includes('config system interface') ||
        (contentToScan.match(/config firewall (address|policy|service)/) !== null)
    ) {
        return 'fortigate';
    }

    // fallback filename check for Fortigate
    if (lowerFilename.includes('fgt') || lowerFilename.includes('forti')) {
        // Just verify it has editing blocks
        if (contentToScan.includes('edit') && contentToScan.includes('next')) {
            return 'fortigate';
        }
    }

    // 2. Cisco ASA Detection
    if (
        contentToScan.includes('ASA Version') ||
        contentToScan.includes('PIX Version') ||
        contentToScan.match(/^hostname /m) && contentToScan.match(/^interface /m) && contentToScan.match(/^nameif /m) !== null ||
        contentToScan.match(/^object network /m) !== null ||
        contentToScan.match(/^access-list /m) !== null
    ) {
        return 'cisco';
    }

    // 3. Check Point Detection
    if (
        contentToScan.includes('PRODUCT SmartCenter') ||
        contentToScan.includes('PRODUCT Security Gateway') ||
        lowerContent.includes('checkpoint') ||
        (contentToScan.match(/^add host /m) !== null && contentToScan.match(/^set host /m) !== null)
    ) {
        return 'checkpoint';
    }

    return 'unknown';
}
