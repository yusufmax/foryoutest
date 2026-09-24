# 4U Tashkent

An immersive, responsive landing page built from the supplied 4U Tashkent media. The aerial opening follows scroll position: `5642` plays first, then `5562` lands on the selected aerial frame. At the end of the page, that frame holds as a full-width aerial view, automatically traces one tower, lets visitors preview floors by hovering over the facade or floor buttons, and opens a draggable 360° panorama through a zoom and circular transition.

## Run

```sh
python3 -m http.server 4173
```

Open [http://localhost:4173](http://localhost:4173). No package installation or build step is required.

## Floor-specific views

The supplied folder contains **one** 2:1 panorama. The interface currently uses that same panorama for every floor and states this clearly to visitors. To add verified floor views, place each 2:1 equirectangular image in `assets/` and add its path to `panoramaByFloor` in `src/main.js`, for example:

```js
const panoramaByFloor = {
  12: 'assets/floor-12.webp',
  16: 'assets/floor-16.webp'
};
```

Unmapped floors retain the clearly labeled demonstration panorama. The supplied aerial clips also have different boundary frames, so the opening blends between them rather than claiming a frame-perfect continuous take.

## Source

Project facts and copy are based on the [official 4U Tashkent page](https://nrg-bi.uz/uz-ru/landing/4u-tashkent). The building renders, aerial clips, and panorama came from the materials supplied with this project.

## GitHub Pages

The site uses relative asset paths and can be served from a repository subpath. Its published URL is [yusufmax.github.io/foryoutest](https://yusufmax.github.io/foryoutest/).
