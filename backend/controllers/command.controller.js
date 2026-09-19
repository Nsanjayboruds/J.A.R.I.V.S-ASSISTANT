import { exec } from "child_process";

export const executeCommand = (req, res) => {
    const { commandToRun } = req.body;

    if (!commandToRun) {
        return res.status(400).json({ success: false, message: "No command provided." });
    }

    console.log(`Executing system command: ${commandToRun}`);

    exec(commandToRun, (error, stdout, stderr) => {
        if (error) {
            console.error(`Error executing command: ${error.message}`);
            return res.status(500).json({ success: false, message: "Error executing command", error: error.message });
        }
        if (stderr) {
            console.warn(`Command stderr: ${stderr}`);
        }
        console.log(`Command stdout: ${stdout}`);
        res.json({ success: true, message: "Command executed successfully", output: stdout });
    });
};
