# Photography credits

All images below are from [Unsplash](https://unsplash.com) under the
[Unsplash License](https://unsplash.com/license): free to use for commercial
and non-commercial purposes, no permission needed, attribution appreciated but
not required. They are stored here rather than hot-linked so that no
third-party CDN sees this app's traffic.

Each was fetched at 800×450, entropy-cropped, q=72.

| File | Unsplash photo id | Subject |
|---|---|---|
| `calm.jpg` | `photo-1506126613408-eca07ce68773` | Seated meditation at sunrise |
| `paths.jpg` | `photo-1544367567-0f2fcb009e0b` | Yoga pose against a pink sunset |
| `tests.jpg` | `photo-1455390582262-044cdead277a` | Fountain pen on a written page |
| `read.jpg` | `photo-1481627834876-b7833e8f5570` | Library shelves under warm lamps |
| `inkblot.jpg` | `photo-1541701494587-cb58502866ab` | Coloured ink dispersing in water |
| `stillness.jpg` | `photo-1518241353330-0f7941c2d9b5` | Lone tree mirrored in still water |
| `water.jpg` | `photo-1439066615861-d1af74d74000` | Wooden dock on a calm lake |
| `forest.jpg` | `photo-1418065460487-3e41a6c84dc5` | Mist over a pine forest |
| `night.jpg` | `photo-1519681393784-d120267933ba` | Night sky over snowy peaks |
| `trail.jpg` | `photo-1476231682828-37e571bc172f` | Road curving through forest, from above |

To re-fetch any of them:

```sh
curl -o calm.jpg -L "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&h=450&fit=crop&crop=entropy&q=72&fm=jpg"
```

The mapping from file to where it appears in the UI lives in
`src/shared/photos.js`.
