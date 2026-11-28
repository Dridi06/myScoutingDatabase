/** Remove an orphan closing brace from malformed chat payloads without altering code. */
export function cleanMyKiMessageText(value){
 const text=String(value??'');
 if(text.includes('{')||text.includes('\u0060\u0060\u0060')||text.includes('\u0060'))return text;
 return text.replace(/\n[ \t]*\}[ \t]*$/u,'').trimEnd();
}
