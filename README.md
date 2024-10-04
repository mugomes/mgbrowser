# MGBrowser

Crie e execute aplicativos desenvolvidos em PHP no desktop.

## Requerimento

- Windows 10 ou superior de 64 bits
- Linux Debian 12 ou superior de 64 bits com sudo ativado
- Linux Ubuntu 22.04 ou superior de 64 bits

## Instalação

Não requer instalação, é só extrair e executar.

O A

### Exemplos

Para criar seu primeiro aplicativo abra a pasta app e veja exemplos de como trabalhar com o MGBrowser.

### Rotas Personalizadas

Altere o router para true no arquivo config.json dentro da pasta app/config e crie um arquivo chamado router.php dentro da sua pasta app.

Exemplo de Rotas Personalizadas

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
# Doação

Se você puder ajudar esse projeto financeiramente, vou deixar formas de apoio abaixo.

 - PIX: pixmugomes@gmail.com
 - Asaas: https://www.asaas.com/c/72mxu6ilkis5rwxz

# License

The MGBrowser is provided under:

[SPDX-License-Identifier: MIT](https://spdx.org/licenses/MIT.html)

Licensed under the MIT license.
