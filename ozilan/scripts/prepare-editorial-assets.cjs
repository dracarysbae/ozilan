const fs = require('node:fs/promises');
const path = require('node:path');
const sharp = require('sharp');

(async () => {
  const inputs = process.argv.slice(2);
  if (inputs.length !== 3) throw new Error('Expected source images: objects, flowers, studio');
  const target = path.join(__dirname, '../public/editorial');
  await fs.mkdir(target, {recursive:true});
  for (const [index,name] of ['objects','flowers','studio'].entries()) {
    for (const width of [640,1280]) {
      const file = path.join(target, `${name}-${width}.webp`);
      await sharp(inputs[index]).resize({width,withoutEnlargement:true}).webp({quality:84,effort:5}).toFile(file);
      console.log(`${name}-${width}.webp: ${Math.round((await fs.stat(file)).size/1024)} KB`);
    }
  }
})().catch(error => { console.error(error.message); process.exitCode=1; });
