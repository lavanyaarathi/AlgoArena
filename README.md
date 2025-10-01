AlgoArena is a collaborative coding platform where multiple users can write , edit and run code together in real time - similar to a lightweight version of Google Docs but for coding<br>
The frontend is built using React+Vite. The core part is the Room Page which integrates CodeMirror Editor to provide features like syntax highlighting , auto completion, error detection and multi-language support .<br>
For collaboration we added real time synchronization , user presence indicators , cursor tracking and chat functionality .<br>
For code execution we use Piston API which lets us run code in multiple programming languages securely in a sandboxed environment.<br>
Backend is built on NodeJS and Expressjs . Authentication is handled using JWT and bcrypt for password hashing <br>
For real time collaboration we implemented a CRDT based approach(Yjs) combined with websockets to keep code consistent across all users without conflicts <br> 

