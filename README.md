# FERRO-88 portfolio template

A static portfolio with a ferrofluid droplet and a CRT-style menu. Visitors can explore About, Philosophy, Works, and Contact. The HTML, CSS, JavaScript, and fonts are ready to serve directly.

[Try the live template](https://otomop.github.io/ferro88-portfolio-template/).

## Make your own copy

1. On GitHub, choose **Use this template → Create a new repository**.
2. To publish at `https://USERNAME.github.io/`, name the new repository `USERNAME.github.io`, replacing `USERNAME` with your GitHub account name. Another repository name gives you a project site at `https://USERNAME.github.io/REPOSITORY/`.
3. In your new repository, edit [`portfolio.js`](./portfolio.js) and replace the sample content with your own. Keep the `window.PORTFOLIO` assignment and the existing object structure. The display name, bio, skills, philosophy, projects, contact details, and footer live together here.

Each item in `projects` represents one row under Works. A project with its own page looks like this.

```js
{ title: "Garden Atlas", client: "City Museum", role: "Designer", year: "2025", url: "https://example.com/garden-atlas" }
```

Give a project a `url` to open its page in a new tab. Omit the `url` to keep it as a musical button. Each entry in `socials` takes a `label` and a `url`. For links to files in your repository, use paths such as `./projects/garden-atlas.html` so they also work on project sites.

## Preview locally

If you have Python 3, start a local server from the directory containing `index.html`.

```sh
python -m http.server 8000 --bind 127.0.0.1
```

Open [the local preview](http://127.0.0.1:8000/). Try each section and check your project and contact links. Use `Ctrl+C` in the terminal to stop the preview.

## Publish with GitHub Pages

1. Commit your changes to `main`. Keep `index.html` and the empty `.nojekyll` file at the repository root. The latter tells Pages to serve these static files directly.
2. Open **Settings → Pages**. Under **Build and deployment**, choose **Deploy from a branch**, select **main** and **/ (root)**, then save. On GitHub Free the repository must be public.
3. When deployment finishes, open the published URL shown under **Settings → Pages**. Future pushes to `main` publish your edits.

A repository generated from this template starts as an independent snapshot. To adopt a later animation fix, review the change in the template and apply it to your own copy. [GitHub template guide](https://docs.github.com/en/repositories/creating-and-managing-repositories/creating-a-repository-from-a-template) · [GitHub Pages publishing guide](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)

## License and fonts

The template code uses the [MIT License](./LICENSE).

The site serves Doto, JetBrains Mono, and Michroma from `fonts/`. Each family is distributed under the SIL Open Font License 1.1. Keep the corresponding copyright and license files with the fonts. [Doto](./fonts/LICENSE-doto.txt) · [JetBrains Mono](./fonts/LICENSE-jetbrainsmono.txt) · [Michroma](./fonts/LICENSE-michroma.txt)
