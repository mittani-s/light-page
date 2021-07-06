// gulpモジュール、プラグインの読み込み
const { src, dest, watch, series, parallel } = require("gulp");
var sass = require("gulp-sass")(require("sass"));
const plumber = require("gulp-plumber"); //エラー時の強制終了を防止
const postcss = require("gulp-postcss"); /* autoprefixerとセットで使用 */
const autoprefixer = require("autoprefixer"); /* ベンダープレフィックスの指定（今回はpackage.jsonにて対応） */
const cssdeclsort = require("css-declaration-sorter"); /* プロパティの並び順を整理 */
const sassGlob = require("gulp-sass-glob"); // @importを纏めて（ディレクトリ単位で）指定
const gcmq = require("gulp-group-css-media-queries"); // media queryを纏める
const mode = require("gulp-mode")({
  modes: ["production", "development"], // 本番実装時は 'gulp --production'
  default: "development",
  verbose: false,
});
// browsersync
const browserSync = require("browser-sync");

// scssのコンパイル
const compileSass = (done) => {
  const postcssPlugins = [
    autoprefixer({
      // browserlistはpackage.jsonに記載[推奨]
      cascade: false,
      // grid: 'autoplace' // IE11のgrid対応('-ms-')
    }),
    cssdeclsort({ order: "alphabetical" /* smacss, concentric-css */ }),
  ];

  src("./src/assets/scss/style.scss", { sourcemaps: true /* init */ })
    .pipe(plumber())
    .pipe(sassGlob())
    .pipe(
      sass({ outputStyle: "expanded" })
    ) /* expanded, nested, campact, compressedから選択 */
    .pipe(postcss(postcssPlugins))
    .pipe(mode.production(gcmq()))
    .pipe(dest("./dist/css", { sourcemaps: "./sourcemaps" /* write */ }));
  done(); // 終了宣言
};

// htmlの吐き出し
const compileHtml = (done) => {
  src("./src/*.html").pipe(plumber()).pipe(dest("./dist"));
  done();
};

// ローカルサーバ起動
const buildServer = (done) => {
  browserSync.init({
    port: 8080,
    // notify: false,
    // 静的サイト
    server: {
      baseDir: "./dist",
      index: "index.html",
    },
    // 動的サイト
    // files: ['./**/*.php'],
    // proxy: 'http://localsite.wp/',
  });
  done();
};

// ブラウザ自動リロード
const browserReload = (done) => {
  browserSync.reload();
  done();
};

// ファイル監視
const watchFiles = () => {
  // watch("./**/*.html", browserReload);
  watch("./src/*.html", series(compileHtml, browserReload));
  watch("./src/assets/scss/**/_*.scss", series(compileSass, browserReload));
  // watch("./src/assets/js/**/*.js", series(bundleJs, browserReload));
};

exports.sass = compileSass;
exports.html = compileHtml;
exports.default = parallel(buildServer, watchFiles);
