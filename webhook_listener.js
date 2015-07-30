// Listen on port 9001
var gith = require('gith').create( 9001 );
// Import execFile, to run our bash script
var exec = require('child_process').exec;

var cwd = process.cwd();

gith({
  repo: 'moward/Hyde'
}).on( 'all', function( payload ) {
  if( payload.branch === 'master' )
  {
    exec('cd "' + cwd + '"; node hyde example/source ~/gh-pages', function(error, stdout, stderr) {
      if (error) throw error;
      // Log success in some manner
      console.log( stdout, stderr );

      exec('cd ~/gh-pages; git add .; git commit -m "BUILD"; git push origin gh-pages', function(error, stdout, stderr) {
        if (error) throw error;
        // Log success in some manner
        console.log( stdout, stderr );
      });
    });
  }
});
