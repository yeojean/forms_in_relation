FORMS IN RELATION — MVP STARTER

1. Open this whole folder in VS Code.
2. Run index.html with Live Server if you have it.
   If you do not use Live Server, you can also run:
      python3 -m http.server 8000
   in the VS Code terminal, then visit:
      http://localhost:8000
3. Landing:
   triangle = Received
   square   = Destroyed
   circle   = Given Again
   hexagon  = Collection
   Hover pauses the changing shape.
4. Story pages:
   move the mouse over the image to see each theme's effect.
   click the image to open the text panel.
5. Replace images by putting your own photos in:
      assets/images/
   Then edit the image src in:
      received.html
      destroyed.html
      given-again.html
      collection.html
6. Replace the placeholder story text directly in each HTML file.

MVP files:
index.html
received.html
destroyed.html
given-again.html
collection.html
about.html
styles.css
script.js
assets/images/


V2 CHANGES
- Removed the landing instruction text.
- Added THERE IS NO FINAL FORM at the upper left of every internal page.
  Clicking it always returns to index.html.
- Added a BACK button that uses browser history.
- Story pages now support multiple images through content.js.
- Put your full collection in assets/images/. After the files are provided,
  each image can be classified into received / destroyed / given and listed
  in content.js. Left/right arrows then cycle through that theme.

V3 CHANGES
- Landing shapes now rotate every 550ms instead of 1250ms.
- Each theme now starts with a different image.
- Received and Given Again currently use crops from the Figma board screenshot.
  Replace them with original full-resolution collection photos when you upload them.


V4 PHOTO CLASSIFICATION

FORM RECEIVED
IMG_4548.jpg
IMG_4549.jpg
IMG_4550.jpg
IMG_4673.jpg
IMG_4677.jpg
IMG_4690.jpg

FORM DESTROYED
IMG_4556.jpg
IMG_4576-2.jpg
IMG_4576.jpg
IMG_4692.jpg
IMG_4739.jpg
IMG_4740.jpg

FORM GIVEN AGAIN
IMG_4570.jpg
IMG_4686.jpg

Collection now contains all 14 uploaded images.
Clicking a collection image opens that exact image on its theme page.

MORPH UPDATE
- Landing uses SVG point morphing with 8 matched vertices.
- Target corners begin moving first, then edge points follow for a smoother corner-led transition.
- Landing icon size increased slightly to 20px.
