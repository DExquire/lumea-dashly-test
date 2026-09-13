import type { Core } from '@strapi/strapi';

const allowedMediaTypes = [
  'image/*',
  'video/*',
  'audio/*',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.*',
  'text/plain',
  'text/csv',
];

const deniedTypes = [
  'image/svg+xml',
  'application/vnd.microsoft.portable-executable',
  'application/x-msdownload',
  'application/x-msdos-program',
  'application/x-executable',
  'application/x-dosexec',
  'application/x-sh',
  'text/x-shellscript',
  'application/x-mach-binary',
];

const config = ({ env }: Core.Config.Shared.ConfigParams): Core.Config.Plugin => {
  const cloudinaryName = env('CLOUDINARY_NAME');

  return {
    'users-permissions': {
      config: {
        jwtManagement: 'refresh',
        sessions: {
          httpOnly: true,
        },
      },
    },
    upload: {
      config: {
        /**
         * Free hosting (Render) gives every deploy a fresh, ephemeral disk, so
         * images uploaded through the admin panel would disappear on restart.
         * When Cloudinary credentials are present the provider is switched over;
         * locally the default filesystem provider is used and no account is needed.
         */
        ...(cloudinaryName
          ? {
              provider: 'cloudinary',
              providerOptions: {
                cloud_name: cloudinaryName,
                api_key: env('CLOUDINARY_KEY'),
                api_secret: env('CLOUDINARY_SECRET'),
              },
              actionOptions: {
                upload: {},
                uploadStream: {},
                delete: {},
              },
            }
          : {}),
        security: {
          allowedTypes: allowedMediaTypes,
          deniedTypes,
        },
      },
    },
  };
};

export default config;
