const uuid='[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}';
const cloudPath=new RegExp(`^cloudinary/(${uuid})/(${uuid})\\.webp$`);
export function cloudinaryPhotoUrl(path:string,cloudName:string) {
  const match=cloudPath.exec(path);
  if(!match||!/^[-a-z0-9]+$/.test(cloudName))return '';
  // Serve the already prepared original. Dynamic transformations would consume
  // extra credits and create additional stored derivatives.
  return `https://res.cloudinary.com/${cloudName}/image/upload/ozilan/${match[1]}/${match[2]}.webp`;
}
