
Set objNetwork = CreateObject("WScript.Network")
Set colPrinters = objNetwork.EnumPrinterConnections

For i = 0 To colPrinters.Count - 1 Step 2
  WScript.Echo colPrinters.Item(i) & "||" & colPrinters.Item(i + 1)
Next
