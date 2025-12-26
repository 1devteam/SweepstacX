import { readFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import Ajv from 'ajv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const defaultConfig = {
  complexity: { maxFunction: 10, maxAverage: 8, minMaintainability: 70 },
  duplication: { maxLines: 5, maxPercent: 5 },
  lint: { maxErrors: 0, maxWarningsPerKLOC: 5 },
  deps: { unused: 0, missing: 0 },
  fuzz: { timeout: 5000, crashes: 0 },
  ignore: ['node_modules/**', 'dist/**', 'coverage/**', '.git/**'],
  typescript: { enabled: true, checkTypeImports: true },
  cache: { enabled: true, maxAge: 3600000 }
};

export async function loadConfig(_cliPath = '.', configPath = '') {
  try {
    const target = configPath
      ? resolve(process.cwd(), configPath)
      : resolve(process.cwd(), '.sweeperc.json');

    if (existsSync(target)) {
      const raw = await readFile(target, 'utf8');
      const user = JSON.parse(raw);
      
      // Validate config
      const isValid = await validateConfig(user);
      if (!isValid) {
        console.warn('⚠️  Configuration has errors, using defaults');
        return JSON.parse(JSON.stringify(defaultConfig));
      }
      
      return deepMerge(defaultConfig, user);
    }
  } catch (err) {
    console.warn('⚠️  Error loading config:', err.message);
  }
  return JSON.parse(JSON.stringify(defaultConfig));
}

/**
 * Validate configuration against JSON schema
 */
async function validateConfig(config) {
  try {
    const schemaPath = resolve(__dirname, '../../docs/config-schema.json');
    
    if (!existsSync(schemaPath)) {
      // Schema not available, skip validation
      return true;
    }
    
    const schemaContent = await readFile(schemaPath, 'utf8');
    const schema = JSON.parse(schemaContent);
    
    const ajv = new Ajv({ allErrors: true });
    const validate = ajv.compile(schema);
    const valid = validate(config);
    
    if (!valid) {
      console.error('\n⚠️  Configuration validation errors:');
      validate.errors.forEach(err => {
        const path = err.instancePath || 'root';
        console.error(`  • ${path}: ${err.message}`);
      });
      console.error('');
      return false;
    }
    
    return true;
  } catch (_err) {
    // If validation fails, assume config is okay
    return true;
  }
}

function deepMerge(base, add) {
  if (Array.isArray(base) && Array.isArray(add)) return Array.from(new Set([...base, ...add]));
  if (isObj(base) && isObj(add)) {
    const out = { ...base };
    for (const k of Object.keys(add)) out[k] = k in base ? deepMerge(base[k], add[k]) : add[k];
    return out;
  }
  return add ?? base;
}

const isObj = (v) => v && typeof v === 'object' && !Array.isArray(v);
