import js from '@eslint/js';
import globals from 'globals';
import react from 'eslint-plugin-react';
import hooks from 'eslint-plugin-react-hooks';
export default [js.configs.recommended,{files:['**/*.{js,jsx}'],languageOptions:{ecmaVersion:'latest',sourceType:'module',parserOptions:{ecmaFeatures:{jsx:true}},globals:{...globals.browser}},plugins:{react,'react-hooks':hooks},settings:{react:{version:'detect'}},rules:{'no-unused-vars':['warn',{argsIgnorePattern:'^_',varsIgnorePattern:'^[A-Z_]'}],'react/jsx-uses-react':'off','react/jsx-uses-vars':'error','react/react-in-jsx-scope':'off','react-hooks/rules-of-hooks':'error','react-hooks/exhaustive-deps':'warn'}}];
