var gulp        = require('gulp'),
browserSync = require('browser-sync').create(),
sass        = require('gulp-sass'),
concat      = require('gulp-concat'), // Подключаем gulp-concat (для конкатенации файлов)
uglify      = require('gulp-uglifyjs'); // Подключаем gulp-uglifyjs (для сжатия JS),
cssnano     = require('gulp-cssnano'), // Подключаем пакет для минификации CSS
rename      = require('gulp-rename'), // Подключаем библиотеку для переименования файлов
del         = require('del'), // Подключаем библиотеку для удаления файлов и папок
svgSprite = require('gulp-svg-sprites'),
svgmin = require('gulp-svgmin'),
cheerio = require('gulp-cheerio'),
replace = require('gulp-replace');

gulp.task('svgSpriteBuild', function () {
	return gulp.src('src/images/icons-svg/*.svg')
		// minify svg
		.pipe(svgmin({
			js2svg: {
				pretty: true
			}
		}))
		// remove all fill and style declarations in out shapes
		.pipe(cheerio({
			run: function ($) {
				$('[fill]').removeAttr('fill');
				$('[style]').removeAttr('style');
			},
			parserOptions: { xmlMode: true }
		}))
		// cheerio plugin create unnecessary string '>', so replace it.
		.pipe(replace('&gt;', '>'))
		// build svg sprite
		.pipe(svgSprite({
				mode: "symbols",
				preview: false,
				selector: "icon-%f",
				svg: {
					symbols: 'symbol_sprite.html'
				}
			}
		))
		.pipe(gulp.dest('src/images'));
});

gulp.task('svgSpriteSass', function () {
	return gulp.src('src/images/icons-svg/*.svg')
		.pipe(svgSprite({
				preview: false,
				selector: "icon-%f",
				svg: {
					sprite: 'svg_sprite.html'
				},
				cssFile: 'scss/_svg_sprite.scss',
				templates: {
					css: require("fs").readFileSync('src/scss/_sprite-template.scss', "utf-8")
				}
			}
		))
		.pipe(gulp.dest('src/images/'));
});

gulp.task('svgSprite', ['svgSpriteBuild', 'svgSpriteSass']);

// Compile sass into CSS & auto-inject into browsers
gulp.task('sass', function() {
    return gulp.src(['node_modules/bootstrap/scss/bootstrap.scss', 'src/scss/*.scss'])
        .pipe(sass())
        .pipe(gulp.dest("src/css"))
        .pipe(browserSync.stream());
});

// Move the javascript files into our /src/js folder
gulp.task('js', function() {
    return gulp.src(['node_modules/bootstrap/dist/js/bootstrap.min.js', 'node_modules/jquery/dist/jquery.min.js', 'node_modules/tether/dist/js/tether.min.js'])
        .pipe(gulp.dest("src/js"))
        .pipe(browserSync.stream());
});

gulp.task('scripts', function() {
    return gulp.src([ // Берем все необходимые библиотеки
        'src/libs/jquery/dist/jquery.min.js', // Берем jQuery
        ])
        .pipe(concat('libs.min.js')) // Собираем их в кучу в новом файле libs.min.js
        .pipe(uglify()) // Сжимаем JS файл
        .pipe(gulp.dest('src/js')); // Выгружаем в папку app/js
});

gulp.task('css-libs', ['sass'], function() {
    return gulp.src('src/css/libs.css') // Выбираем файл для минификации
        .pipe(cssnano()) // Сжимаем
        .pipe(rename({suffix: '.min'})) // Добавляем суффикс .min
        .pipe(gulp.dest('src/css')); // Выгружаем в папку app/css
});

// Static Server + watching scss/html files
gulp.task('serve', ['css-libs', 'scripts'], function() {

    browserSync.init({
        server: "./src"  
    });

    gulp.watch(['src/scss/bootstrap/scss/bootstrap.scss', 'src/scss/*.scss'], ['sass']);
    gulp.watch("src/*.html").on('change', browserSync.reload);
});

gulp.task('default', ['js','serve']);

gulp.task('clean', function() {
    return del.sync('dist'); // Удаляем папку dist перед сборкой
});

gulp.task('build', ['clean', 'sass', 'svgSprite', 'scripts'], function() {
    
        var buildCss = gulp.src([ // Переносим CSS стили в продакшен
            'src/css/*.css',
            'src/css/libs.min.css'
            ])
        .pipe(gulp.dest('dist/css'))
    
        var buildFonts = gulp.src('src/fonts/**/*') // Переносим шрифты в продакшен
        .pipe(gulp.dest('dist/fonts'))
    
        var buildJs = gulp.src('src/js/**/*') // Переносим скрипты в продакшен
		.pipe(gulp.dest('dist/js'))
		
        var buildImg = gulp.src('src/images/**/*') // Переносим скрипты в продакшен
        .pipe(gulp.dest('dist/images'))
        
        var buildHtml = gulp.src('src/*.html') // Переносим HTML в продакшен
        .pipe(gulp.dest('dist'));
    });