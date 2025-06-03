import solc from 'solc';

// Define a type for the compiler instance
type SolcCompiler = typeof solc;

// Cache for loaded compiler versions
const compilerCache: { [version: string]: SolcCompiler } = {};

/**
 * Load a specific version of the Solidity compiler
 * @param version Solidity version (e.g., '0.8.20')
 * @returns Promise that resolves to the compiler instance
 */
export async function loadSolc(version: string): Promise<SolcCompiler> {
  // Return cached version if available
  if (compilerCache[version]) {
    return compilerCache[version];
  }

  // For now, just return the default solc instance
  // In a production environment, you would want to:
  // 1. Download the specific version from solc-bin
  // 2. Load it using solc.loadRemoteVersion
  // 3. Cache the result
  compilerCache[version] = solc;
  return solc;
} 