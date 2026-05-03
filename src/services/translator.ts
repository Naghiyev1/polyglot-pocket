
export async function translateText(text: string, targetLang: string, sourceLang: string = 'Autodetect') {
  if (!text.trim()) return '';
  
  // Map languages to ISO codes if needed
  const langMap: { [key: string]: string } = {
    'English': 'en',
    'French': 'fr',
    'Spanish': 'es',
    'German': 'de',
    'Autodetect': 'auto'
  };

  const sl = langMap[sourceLang] || 'auto';
  const tl = langMap[targetLang] || 'en';

  try {
    const response = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${sl}|${tl}`);
    const data = await response.json();
    
    if (data.responseData) {
      return data.responseData.translatedText;
    }
    throw new Error('Translation failed');
  } catch (error) {
    console.error('Translation error:', error);
    throw error;
  }
}

export async function getDictionaryEntry(word: string, language: string) {
  // Free Dictionary API is mainly for English. 
  // For other languages, we'll try to find a definition via translation or fallback.
  
  if (language.toLowerCase() === 'english') {
    try {
      const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`);
      if (!response.ok) throw new Error('Not found');
      const data = await response.json();
      
      const entry = data[0];
      return {
        definition: entry.meanings[0].definitions[0].definition,
        pronunciation: entry.phonetic || (entry.phonetics && entry.phonetics[0]?.text) || 'N/A',
        examples: entry.meanings[0].definitions[0].example ? [entry.meanings[0].definitions[0].example] : [],
        synonyms: entry.meanings[0].synonyms || []
      };
    } catch (error) {
      console.error('Dictionary error:', error);
    }
  }

  // Fallback for non-English or errors: 
  // Just use MyMemory to get a "definition" by translating it to English and back? 
  // No, let's just return a placeholder or use the word itself.
  return {
    definition: "Detailed definitions are currently only available for English. Local packs provide basic meanings for other languages.",
    pronunciation: "N/A",
    examples: [],
    synonyms: []
  };
}
