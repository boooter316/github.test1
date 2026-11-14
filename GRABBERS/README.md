# Legacy grabber directory

The old Discord token-grabber script has been removed from the current project.

Do not collect browser-stored credentials, session tokens, cookies, or private account secrets, and do not transmit them to a webhook. For defensive review, use the **Discord Security Scanner** in the local browser dashboard. It inspects only files you explicitly select, redacts detected values, and does not upload or validate credentials.

A webhook secret was embedded in the deleted historical source. Revoke/rotate that Discord webhook immediately. Removing the file from the current branch does not erase earlier Git commits or repository history.