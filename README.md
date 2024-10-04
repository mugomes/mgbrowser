# MGBrowser

Run apps developed in PHP for desktop with MGBrowser.

## Requirements

- Windows 10 or higher 64-bit
- Linux Debian 12 or higher 64-bit with sudo enabled
- Linux Ubuntu 22.04 or higher 64-bit

## Installation

No installation required, just extract and run.

### Examples

To create your first application, open the "app" folder and see examples of how to work with MGBrowser.

### Custom Routes

Change router to true in the config.json file inside the "app/config" folder and create a file called router.php inside your "app" folder.

Example of Custom Routes

```
if ($_SERVER['REQUEST_URI'] == '/') {
    include_once(dirname(__FILE__) . '/index.php');
} else {
    if (strstr($_SERVER['REQUEST_URI'], '.php')) {
        if (file_exists(dirname(__FILE__) . '/' . $_SERVER['REQUEST_URI'])) {
            include_once(dirname(__FILE__) . '/' . $_SERVER['REQUEST_URI']);
        } else {
            return false;
        }
    } else {
        return false;
    }
}
```
# Donation

If you can help this project financially, I will leave ways to support you below.

 - PIX: pixmugomes@gmail.com
 - Asaas: https://www.asaas.com/c/72mxu6ilkis5rwxz

# License

The MGBrowser is provided under:

[SPDX-License-Identifier: MIT](https://spdx.org/licenses/MIT.html)

Licensed under the MIT license.
