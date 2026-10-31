!macro customInstall
  ; Add firewall rule for backend port 5001
  nsExec::ExecToLog 'netsh advfirewall firewall delete rule name="Restro POS Backend"'
  nsExec::ExecToLog 'netsh advfirewall firewall add rule name="Restro POS Backend" dir=in action=allow protocol=TCP localport=5001 profile=any'
!macroend

!macro customUnInstall
  ; Remove firewall rule on uninstall
  nsExec::ExecToLog 'netsh advfirewall firewall delete rule name="Restro POS Backend"'
!macroend
