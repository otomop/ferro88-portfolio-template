# FERRO-88 portfolio template

A standalone HTML, CSS, and JavaScript portfolio with an interactive ferrofluid droplet and a CRT-style menu. Visitors can explore About, Philosophy, Works, and Contact. The fonts and graphics ship with the template. Any static web host can serve it.

[Try the live template](https://otomop.github.io/ferro88-portfolio-template/).

## Customize your portfolio

1. Download the template and extract it into a folder, or choose **Use this template** on GitHub to start your own repository.
2. Edit [`portfolio.js`](./portfolio.js). The display name, bio, skills, philosophy, projects, contact details, and footer live together in `window.PORTFOLIO`. Replace the sample content and leave optional fields empty to hide them.
3. Put your project files in the same folder or its subfolders. Link to them with relative paths such as `./projects/garden-atlas.html`, or use an HTTPS address for a project hosted elsewhere.

Each item in `projects` represents one row under Works. A project with its own page looks like this.

```js
{ title: "Garden Atlas", client: "City Museum", role: "Designer", year: "2025", url: "https://example.com/garden-atlas" }
```

Give a project a `url` to open its page in a new tab. Omit the `url` to keep it as a musical button. Each entry in `socials` takes a `label` and a `url`.

## Preview locally

If you have Python 3, start a local server from the directory containing `index.html`.

```sh
python -m http.server 8000 --bind 127.0.0.1
```

Open [the local preview](http://127.0.0.1:8000/). Try each section and check your project and contact links. Use `Ctrl+C` in the terminal to stop the preview.

## Publish anywhere

Upload the contents of the template folder to your web host. Keep `index.html` at the top of the published folder and preserve the `fonts/` directory and the files beside it. If your host asks for a build command, leave it empty. Use the directory containing `index.html` as the publish directory.

The same files work at a custom domain, a subdomain, or a path such as `/portfolio/`.

### Optional GitHub Pages setup

1. Commit your changes to `main`. Keep `index.html` and the empty `.nojekyll` file at the repository root. The latter tells Pages to serve these static files directly.
2. Open **Settings → Pages**. Under **Build and deployment**, choose **Deploy from a branch**, select **main** and **/ (root)**, then save.
3. When deployment finishes, open the URL shown under **Settings → Pages**. A repository named `USERNAME.github.io` publishes at your account's root address. Other repository names publish at `https://USERNAME.github.io/REPOSITORY/` by default.

A repository generated from this template starts as an independent snapshot. To adopt a later animation fix, review the change in the template and apply it to your own copy. [GitHub template guide](https://docs.github.com/en/repositories/creating-and-managing-repositories/creating-a-repository-from-a-template) · [GitHub Pages publishing guide](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)

## License and fonts

The template code uses the [MIT License](./LICENSE).

The site serves Doto, JetBrains Mono, and Michroma from `fonts/`. Each family is distributed under the SIL Open Font License 1.1. Keep the corresponding copyright and license files with the fonts. [Doto](./fonts/LICENSE-doto.txt) · [JetBrains Mono](./fonts/LICENSE-jetbrainsmono.txt) · [Michroma](./fonts/LICENSE-michroma.txt)
