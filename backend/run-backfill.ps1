# Load Npgsql assembly
Add-Type -Path "D:\Project\EdTech\Yakinlulus.id\backend\Npgsql.dll"

$connectionString = "Host=db.cjrhqywtwlmebthajrkx.supabase.co;Port=5432;Database=postgres;Username=postgres;Password=kqHtPV72xUL1PYv1"

try {
    $conn = New-Object Npgsql.NpgsqlConnection($connectionString)
    $conn.Open()
    Write-Host "Connected to database successfully"
    
    $sql = Get-Content "D:\Project\EdTech\Yakinlulus.id\backend\backfill.sql" -Raw
    
    $cmd = New-Object Npgsql.NpgsqlCommand($sql, $conn)
    $reader = $cmd.ExecuteReader()
    
    Write-Host "`nResults:"
    while ($reader.Read()) {
        Write-Host "  Total exams: $($reader['total_exams'])"
        Write-Host "  With metadata: $($reader['with_metadata'])"
    }
    $reader.Close()
    
    $cmd.Dispose()
    $conn.Close()
    Write-Host "`nBackfill completed successfully"
}
catch {
    Write-Host "Error: $_" -ForegroundColor Red
    exit 1
}
