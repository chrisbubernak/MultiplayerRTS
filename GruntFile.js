module.exports = function (grunt) {
    grunt.loadNpmTasks('grunt-typescript');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-connect');
    grunt.loadNpmTasks('grunt-express');
    grunt.loadNpmTasks('grunt-open');
    grunt.loadNpmTasks('grunt-tslint');

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        express: {
          server : {
            options: {
              port:  3003,
              server: 'app.js',
              hostname: '*'
            }
          }
        },
        tslint: {
            options: {
                configuration: grunt.file.readJSON('node_modules/grunt-tslint/tslint.json')
            },
            files: {
                src: ['typescript/**/*.ts']
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
            //files: '**/*.ts',
            //tasks: ['typescript']
        },
        open: {
            dev: {
                path: 'http://localhost:3003/'
            }
        }
    });
 
  

    grunt.registerTask('default', ['tslint', 'typescript', 'express:server', 'open', 'watch']);
 
}