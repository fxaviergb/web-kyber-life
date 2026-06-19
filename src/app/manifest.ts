import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: 'Kyber',
        short_name: 'Kyber',
        description: 'Gestión inteligente de gastos y vida',
        start_url: '/',
        display: 'standalone',
        background_color: '#0f172a',
        theme_color: '#0f172a',
        icons: [
            {
                src: '/images/logo-kyber-blue-192x192.png',
                sizes: '192x192',
                type: 'image/png',
            },
            {
                src: '/images/logo-kyber-blue-512x512.png',
                sizes: '512x512',
                type: 'image/png',
            },
        ],
    }
}
