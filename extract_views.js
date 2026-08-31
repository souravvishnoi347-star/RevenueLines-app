const fs = require('fs');
const path = require('path');

const baseDir = 'd:/Hostbolt/new me/UI- dashboard/dubai_ai_real_estate_dashboard';

const folders = {
  home: 'luxai_executive_dashboard_light_mode',
  chats: 'luxai_ai_chats',
  leads: 'luxai_leads_management',
  workflows: 'luxai_workflows',
  settings: 'luxai_settings'
};

function htmlToJsx(html) {
  let jsx = html;
  jsx = jsx.replace(/class=/g, 'className=');
  jsx = jsx.replace(/for=/g, 'htmlFor=');
  // Self close img, input, hr, br
  jsx = jsx.replace(/<img([^>]*?)(?<!\/)>/g, '<img$1 />');
  jsx = jsx.replace(/<input([^>]*?)(?<!\/)>/g, '<input$1 />');
  jsx = jsx.replace(/<hr([^>]*?)(?<!\/)>/g, '<hr$1 />');
  jsx = jsx.replace(/<br([^>]*?)(?<!\/)>/g, '<br$1 />');
  // Style strings to objects (basic)
  jsx = jsx.replace(/style="([^"]*)"/g, (match, styleString) => {
    // skip complex styles for now, just replace with empty or manually fix if there's an error. 
    // They have style="font-variation-settings: 'FILL' 1;"
    if (styleString.includes('font-variation-settings')) {
        return `style={{ fontVariationSettings: "'FILL' 1" }}`;
    }
    if (styleString.includes('width:')) {
        let val = styleString.split(':')[1].replace(';','').trim();
        return `style={{ width: '${val}' }}`;
    }
    return match;
  });
  // SVG paths
  jsx = jsx.replace(/stroke-linecap=/g, 'strokeLinecap=');
  jsx = jsx.replace(/stroke-linejoin=/g, 'strokeLinejoin=');
  jsx = jsx.replace(/stroke-width=/g, 'strokeWidth=');
  jsx = jsx.replace(/stroke-dasharray=/g, 'strokeDasharray=');
  jsx = jsx.replace(/stroke-dashoffset=/g, 'strokeDashoffset=');
  jsx = jsx.replace(/viewbox=/g, 'viewBox=');
  jsx = jsx.replace(/preserveaspectratio=/g, 'preserveAspectRatio=');
  
  return jsx;
}

let views = {};

for (const [key, folder] of Object.entries(folders)) {
  const filePath = path.join(baseDir, folder, 'code.html');
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const mainMatch = content.match(/<main[\s\S]*?<\/main>/);
    if (mainMatch) {
      views[key] = htmlToJsx(mainMatch[0]);
    }
  }
}

fs.writeFileSync('d:/Hostbolt/new me/revenueline-app/views.json', JSON.stringify(views, null, 2));
console.log('Extracted views to views.json');
