module.exports = function (grunt) {
    grunt.loadNpmTasks('grunt-typescript');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-connect');
    grunt.loadNpmTasks('grunt-express');
    grunt.loadNpmTasks('grunt-open');
 
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        express: {
          server : {
            options: {
              port:  3000,
              server: 'app.js',
              hostname: '*'
            }
          }
        },
        typescript: {
            base: {
                src: ['typescript/**/*.ts'],
                dest: 'public/scripts/game.js',
                options: {
                    module: 'amd',
                    target: 'es5'
                }
            }
        },
        watch: {
            files: '**/*.ts',
            tasks: ['typescript']
        },
        open: {
            dev: {
                path: 'http://localhost:3000/'
            }
        }
    });
 
  

    grunt.registerTask('default', ['express:server', 'open', 'watch']);
 
}