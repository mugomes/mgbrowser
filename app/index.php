<?php
header("Content-Security-Policy: default-src 'self'; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'");
?>
<!DOCTYPE html>
<html lang="<?php echo $_ENV['MGBROWSER_LANG']; ?>">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>MGBrowser - Run and develop PHP applications for desktop</title>
    <style>
        body {
            font-size: 18px;
        }

        li {
            line-height: 27px;
        }
    </style>
</head>

<body>
    <h3>Information</h3>
    <p id="version" style="line-height: 37px;"></p>
    <p style="margin-top: -7px;">Version of PHP: <?php echo phpversion(); ?></p>

    <h3>Examples</h3>
    <?php
    $files = scandir(dirname(__FILE__) . '/');
    echo '<ul>';
    foreach ($files as $file) {
        if (!empty($file)) {
            if ($file !== '.' && $file !== '..') {
                if (file_exists(dirname(__FILE__) . '/' . $file) && $file !== 'index.php' && $file !== 'style.css' && $file !== 'router.php') {
                    if (is_file(dirname(__FILE__) . '/' . $file)) {
                        printf('<li><a href="%s" target="_blank" rel="noopener">%s</a></li>', $file, ucfirst(str_replace('.php', '', $file)));
                    }
                }
            }
        }
    }
    echo '</ul>';
    ?>
    <script>
        const txtVersion = document.getElementById('version');

        mgbrowser.version('mgbrowser').then((result) => {
            txtVersion.innerHTML = `Version of MGBrowser: ${result}<br>`;
        });

        mgbrowser.version('electron').then((result) => {
            txtVersion.innerHTML += `Version of ElectronJS: ${result}<br>`;
        });

        mgbrowser.version('node').then((result) => {
            txtVersion.innerHTML += `Version of NodeJS: ${result}<br>`;
        });

        mgbrowser.version('chromium').then((result) => {
            txtVersion.innerHTML += `Version of Chromium: ${result}<br>`;
        });
    </script>
</body>

</html>