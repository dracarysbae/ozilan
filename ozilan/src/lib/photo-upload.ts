import {backend,friendlyError} from './backend';
const cloudName=process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME??'';
export const cloudinaryUploads=Boolean(cloudName);
export const uploadSizeLimit=524288;

async function media(body:Blob|Record<string,string>) {
  const {data,error}=await backend().functions.invoke('listing-media',{
    body,headers:{'Content-Type':body instanceof Blob?'image/webp':'application/json'},
  });
  if(error){
    let message='';
    try{const response=(error as {context?:Response}).context;if(response)message=(await response.json()).error??'';}catch{}
    throw new Error(message||friendlyError(error));
  }
  if(data?.error)throw new Error(data.error);
  return data;
}
export async function uploadPhoto(blob:Blob):Promise<string> {
  if(cloudinaryUploads){const result=await media(blob);if(typeof result?.path!=='string')throw new Error('Fotoğraf yüklemesi doğrulanamadı.');return result.path;}
  throw new Error('Fotoğraf bağlantısı hazırlanıyor. Lütfen daha sonra tekrar dene.');
}
export async function discardPhoto(path:string):Promise<boolean> {
  if(path.startsWith('cloudinary/'))return (await media({action:'delete',path})).deleted===true;
  const {data,error}=await backend().storage.from('listing-photos').remove([path]);
  if(error)throw error;return Boolean(data?.length);
}
