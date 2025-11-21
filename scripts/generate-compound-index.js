#!/usr/bin/env node
/**
 * Parse CSV compound data and generate JSON index for the app
 * This script runs at build time to create a searchable compound database
 */

const fs = require('fs');
const path = require('path');

// Parse CSV line handling quoted fields
function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];
    
    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Escaped quote
        current += '"';
        i++; // Skip next quote
      } else {
        // Toggle quote mode
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

// Parse onset/peak/duration string into structured data
function parseOnsetPeakDuration(raw) {
  const result = { raw };
  
  if (!raw || raw === 'N/A') {
    return result;
  }
  
  // Format: "onset / peak / duration"
  // Example: "30-60m / 2-4h / 3-6h"
  // Example: "1-2 weeks for full effect / N/A / 24h"
  const parts = raw.split('/').map(p => p.trim());
  
  if (parts.length >= 1) {
    const onsetStr = parts[0];
    const onsetMatch = onsetStr.match(/(\d+)-?(\d+)?([mh])/);
    if (onsetMatch) {
      const unit = onsetMatch[3];
      const multiplier = unit === 'h' ? 60 : 1;
      result.onsetMin = parseInt(onsetMatch[1]) * multiplier;
      result.onsetMax = onsetMatch[2] ? parseInt(onsetMatch[2]) * multiplier : result.onsetMin;
    }
  }
  
  if (parts.length >= 2) {
    const peakStr = parts[1];
    const peakMatch = peakStr.match(/(\d+)-?(\d+)?([mh])/);
    if (peakMatch) {
      const unit = peakMatch[3];
      const multiplier = unit === 'h' ? 60 : 1;
      result.peakMin = parseInt(peakMatch[1]) * multiplier;
      result.peakMax = peakMatch[2] ? parseInt(peakMatch[2]) * multiplier : result.peakMin;
    }
  }
  
  if (parts.length >= 3) {
    const durationStr = parts[2];
    const durationMatch = durationStr.match(/(\d+)-?(\d+)?([mhd])/);
    if (durationMatch) {
      const unit = durationMatch[3];
      let multiplier = 1;
      if (unit === 'h') multiplier = 60;
      if (unit === 'd') multiplier = 60 * 24;
      result.durationMin = parseInt(durationMatch[1]) * multiplier;
      result.durationMax = durationMatch[2] ? parseInt(durationMatch[2]) * multiplier : result.durationMin;
    }
  }
  
  return result;
}

// Generate category tags from effect type and mechanistic tags
function generateCategoryTags(effectType, mechanisticTags) {
  const tags = new Set();
  
  // Add main effect type
  if (effectType) {
    tags.add(effectType);
  }
  
  // Add mechanistic tags
  mechanisticTags.forEach(tag => tags.add(tag));
  
  // Add derived tags based on patterns
  const effectLower = effectType.toLowerCase();
  const mechanisticLower = mechanisticTags.map(t => t.toLowerCase()).join(' ');
  
  if (effectLower.includes('stimulant')) tags.add('Stimulant');
  if (effectLower.includes('anxiolytic') || mechanisticLower.includes('anxiolytic')) tags.add('Anxiolytic');
  if (effectLower.includes('wakefulness') || mechanisticLower.includes('wakefulness')) tags.add('Wakefulness-promoting');
  if (effectLower.includes('sleep') || mechanisticLower.includes('sleep')) tags.add('Sleep aid');
  if (effectLower.includes('antidepressant') || mechanisticLower.includes('antidepressant')) tags.add('Antidepressant');
  if (effectLower.includes('nootropic') || effectLower.includes('cognitive')) tags.add('Nootropic');
  if (effectLower.includes('adaptogen') || mechanisticLower.includes('adaptogen')) tags.add('Adaptogen');
  if (mechanisticLower.includes('gaba')) tags.add('GABAergic');
  if (mechanisticLower.includes('cholin')) tags.add('Cholinergic');
  if (mechanisticLower.includes('dopamine')) tags.add('Dopamine');
  if (mechanisticLower.includes('serotonin') || mechanisticLower.includes('ssri')) tags.add('Serotonin');
  if (mechanisticLower.includes('nmda')) tags.add('NMDA');
  if (mechanisticLower.includes('neuroprotection')) tags.add('Neuroprotection');
  if (mechanisticLower.includes('adhd')) tags.add('ADHD');
  if (mechanisticLower.includes('non-stimulant')) tags.add('Non-stimulant');
  if (mechanisticLower.includes('racetam')) tags.add('Racetam');
  if (mechanisticLower.includes('peptide')) tags.add('Peptide');
  if (effectLower.includes('herbal') || mechanisticLower.includes('herbal')) tags.add('Herbal');
  
  return Array.from(tags);
}

// Normalize string for searching
function normalizeForSearch(str) {
  return str.toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Generate search terms from name and aliases
function generateSearchTerms(name, aliases) {
  const terms = new Set();
  
  // Add normalized name
  terms.add(normalizeForSearch(name));
  
  // Add each word from name
  normalizeForSearch(name).split(' ').forEach(word => {
    if (word.length > 2) terms.add(word);
  });
  
  // Add normalized aliases
  aliases.forEach(alias => {
    terms.add(normalizeForSearch(alias));
    normalizeForSearch(alias).split(' ').forEach(word => {
      if (word.length > 2) terms.add(word);
    });
  });
  
  return Array.from(terms);
}

// Main processing function
function processCSV(csvPath) {
  const csvContent = fs.readFileSync(csvPath, 'utf-8');
  const lines = csvContent.split('\n').filter(line => line.trim());
  
  if (lines.length === 0) {
    throw new Error('CSV file is empty');
  }
  
  // Parse header
  const headers = parseCSVLine(lines[0]);
  console.log(`Found ${headers.length} columns:`, headers);
  
  const compounds = [];
  const searchIndex = [];
  
  // Parse data rows
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    
    if (values.length < headers.length) {
      console.warn(`Skipping row ${i + 1}: insufficient columns`);
      continue;
    }
    
    // Map values to object
    const row = {};
    headers.forEach((header, idx) => {
      row[header] = values[idx];
    });
    
    // Generate unique ID
    const id = row['Compound'].toLowerCase().replace(/[^a-z0-9]/g, '-');
    
    // Parse aliases
    const aliases = row['Also listed as / alias'] 
      ? row['Also listed as / alias'].split('|').map(a => a.trim()).filter(a => a)
      : [];
    
    // Parse mechanistic tags
    const mechanisticTags = row['Mechanistic Tags']
      ? row['Mechanistic Tags'].split('|').map(t => t.trim()).filter(t => t)
      : [];
    
    // Parse onset/peak/duration
    const onset = parseOnsetPeakDuration(row['Onset/Peak/Duration']);
    
    // Generate category tags
    const categoryTags = generateCategoryTags(row['Effect type'], mechanisticTags);
    
    // Build compound detail object
    const compound = {
      id,
      name: row['Compound'],
      aliases,
      effectType: row['Effect type'],
      primaryEffects: row['Primary effects (summary)'],
      mechanism: row['Mechanism (short)'],
      mechanisticTags,
      acuteEffect: row['Acute effect after one dose?'] === 'Yes',
      onset,
      recreational: row['Recreational?'],
      dependenceTolerance: row['Dependence/Tolerance Risk'],
      daytimeNighttime: row['Daytime vs. Nighttime Fit'],
      interactions: {
        voxra: row['Voxra (Bupropion) Interaction'] || '',
        ssri: row['SSRI (Escitalopram 10mg) Interaction'] || '',
      },
      evidence: {
        strength: row['Evidence Strength'] || '',
        summary: row['Evidence Summary'] || '',
      },
      efficacyScore: parseFloat(row['Efficacy Score']) || 0,
      safetyScore: parseFloat(row['Safety Score']) || 0,
      categoryTags,
    };
    
    compounds.push(compound);
    
    // Build search index entry
    const indexEntry = {
      id,
      name: row['Compound'],
      aliases,
      searchTerms: generateSearchTerms(row['Compound'], aliases),
      effectType: row['Effect type'],
      categoryTags,
    };
    
    searchIndex.push(indexEntry);
  }
  
  console.log(`Processed ${compounds.length} compounds`);
  
  return { compounds, searchIndex };
}

// Main execution
try {
  const csvPath = path.join(__dirname, '..', 'data', 'nootropics-complete-1-BALANCED-EFFICACY.csv');
  const outputDir = path.join(__dirname, '..', 'lib', 'data');
  
  // Create output directory if it doesn't exist
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  console.log('Parsing CSV:', csvPath);
  const { compounds, searchIndex } = processCSV(csvPath);
  
  // Write compounds data
  const compoundsPath = path.join(outputDir, 'compounds.json');
  fs.writeFileSync(compoundsPath, JSON.stringify(compounds, null, 2));
  console.log(`✓ Wrote ${compounds.length} compounds to ${compoundsPath}`);
  
  // Write search index
  const indexPath = path.join(outputDir, 'compound-search-index.json');
  fs.writeFileSync(indexPath, JSON.stringify(searchIndex, null, 2));
  console.log(`✓ Wrote search index to ${indexPath}`);
  
  console.log('\n✅ Compound index generation complete!');
} catch (error) {
  console.error('❌ Error generating compound index:', error);
  process.exit(1);
}
