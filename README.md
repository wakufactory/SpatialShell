# SPATIAL SHELL

## about 

SPATIAL SHELL is playground for WebXR.

With SPATIAL SHELL, you can develop WebXR applications on Mac/Win and run them on the HMD's browser.

It has the following characteristics

 - Development PC/Mac + HMD combination
 - Thoughts on CLI shell
 - Web standard multi-platform
 - Does not depend on specific web services
 - A simple environment where you can write a program and run it.

## guide 

Read first (japanese).

[SPATIAL SHELLスタートアップガイド](https://note.com/wakufactory/n/na57d51909ab9)

## files

 - server.js (server program Runs on Node.js)
 - dist 
    - cmd.sh (command script for mac)
    - cmd.ps1 (command script for win(powershell))
    - html
      - index.html (document root)
      - playground.html (main html for HMD)
      - apps (apps folder)
      - assets (assets folder)
      - js (javascript libs) 
   
## structure

The SPATIAL SHELL mechanism is to run a local web server on Mac/Win and access it using the HMD's browser.

At the same time, use screen sharing on the HMD to operate the WebXR app from your Mac/PC.

![server](./docs/SPATIAL_SHELL_server.png)

The application framework that runs on the browser uses Vue and A-Frame.

The WebXR app consists of a Vue template and A-Frame components.

![framework](./docs/SPATIAL_SHELL_Framework.png)
