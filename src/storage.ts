
export const storage = {
  getStories: () => {
    const data = localStorage.getItem('stories');
    return data ? JSON.parse(data) : [];
  },
  saveStories: (stories: unkown[]) => {
    localStorage.setItem('stories', JSON.stringify(stories));
  },
  getCharacters: () => {
    const data = localStorage.getItem('characters');
    return data ? JSON.parse(data) : [];
  },
  saveCharacters: (characters: unkown[]) => {
    localStorage.setItem('characters', JSON.stringify(characters));
  },
  getAIRules: () => {
    const data = localStorage.getItem('ai_rules');
    return data ? JSON.parse(data) : [];
  },
  saveAIRules: (rules: unkown[]) => {
    localStorage.setItem('ai_rules', JSON.stringify(rules));
  },
  getStyleReferences: () => {
    const data = localStorage.getItem('style_references');
    return data ? JSON.parse(data) : [];
  },
  saveStyleReferences: (refs: unkown[]) => {
    localStorage.setItem('style_references', JSON.stringify(refs));
  },
  getTranslationNames: () => {
    const data = localStorage.getItem('translation_names');
    return data ? JSON.parse(data) : [];
  },
  saveTranslationNames: (names: unkown[]) => {
    localStorage.setItem('translation_names', JSON.stringify(names));
  },
  
  // Export all data to JSON
  exportData: () => {
    const data = {
      stories: storage.getStories(),
      characters: storage.getCharacters(),
      ai_rules: storage.getAIRules(),
      style_references: storage.getStyleReferences(),
      translation_names: storage.getTranslationNames(),
      exportDate: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `truyen-tu-do-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  },
  
  // Import data from JSON
  importData: (jsonData: unkown) => {
    if (jsonData.stories) storage.saveStories(jsonData.stories);
    if (jsonData.characters) storage.saveCharacters(jsonData.characters);
    if (jsonData.ai_rules) storage.saveAIRules(jsonData.ai_rules);
    if (jsonData.style_references) storage.saveStyleReferences(jsonData.style_references);
    if (jsonData.translation_names) storage.saveTranslationNames(jsonData.translation_names);
    window.location.reload();
  }
};
