var gulp = require('gulp');
var plugins = require('gulp-load-plugins')({
	pattern: ['gulp-*', 'gulp.*', 'main-bower-files'],
	replaceString: /\bgulp[\-.]/
});
var mainBowerFiles = require('main-bower-files');

gulp.task('js', function() {
	gulp.src([
            'bower_components/jquery/dist/jquery.js', 
            'bower_components/bootstrap/dist/js/bootstrap.js', 
            'bower_components/moment/moment.js', 
            'bower_components/crypto-js/crypto-js.js', 
            'bower_components/highcharts/highstock.js',
            'bower_components/highcharts/modules/exporting.js',
            'js/*'
        ])
		.pipe(plugins.filter('**/*.js'))
		.pipe(plugins.concat('app.js'))
		.pipe(plugins.uglify())
		.pipe(gulp.dest('dist'));
});


gulp.task('css', function() {
	gulp.src(mainBowerFiles().concat(['css/*']))
		.pipe(plugins.filter('**/*.less'))
        .pipe(plugins.less())
		.pipe(plugins.concat('main.css'))
		.pipe(plugins.uglifycss())
		.pipe(gulp.dest('dist'));
});

gulp.task('default', ['js', 'css']);
