Set WshShell = CreateObject("WScript.Shell")
scriptPath = Replace(WScript.ScriptFullName, "start-agent-hidden.vbs", "lostark-raid-agent.js")
WshShell.Run """C:\Program Files\nodejs\node.exe"" """ & scriptPath & """", 0, False
