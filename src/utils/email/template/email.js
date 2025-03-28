export const confirmTemplate = ({ link = "" }) => {
    return `<!DOCTYPE html>
                     <html lang="en">
                     <head>
                         <meta charset="UTF-8">
                         <meta name="viewport" content="width=device-width, initial-scale=1.0">
                         <title>Activate Your Account</title>
                         <style>
                             body {
                                 font-family: Arial, sans-serif;
                                 text-align: center;
                                 margin: 50px;
                                 background-color: #f9fafc;
                             }
                             .container {
                                 padding: 20px;
                                 border: 1px solid #ddd;
                                 border-radius: 10px;
                                 background-color: #fff;
                                 display: inline-block;
                                 box-shadow: 0 4px 8px rgba(0,0,0,0.1);
                             }
                             h1 {
                                 color: #333;
                             }
                             p {
                                 color: #555;
                                 margin-bottom: 20px;
                             }
                             .btn {
                                 display: inline-block;
                                 padding: 10px 20px;
                                 font-size: 16px;
                                 font-weight: bold;
                                 color: #fff;
                                 background-color: #4caf50;
                                 border: none;
                                 border-radius: 5px;
                                 text-decoration: none;
                                 cursor: pointer;
                             }
                             .btn:hover {
                                 background-color: #45a049;
                             }
                         </style>
                     </head>
                     <body>
                         <div class="container">
                             <h1>Activate Your Account</h1>
                             <p>Click the button below to activate your account:</p>
                             <a href="${link}" class="btn">Activate Now</a>
                         </div>
                     </body>
                     </html>`

}