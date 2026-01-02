# Script para reemplazar todos los @IsUUID por @Matches

$files = Get-ChildItem -Recurse -Filter "*.dto.ts" | Where-Object { $_.FullName -notlike "*node_modules*" }

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    $originalContent = $content
    $changed = $false
    
    # Reemplazar @IsUUID() por @Matches()
    if ($content -match '@IsUUID\(\)') {
        $content = $content -replace '@IsUUID\(\)', '@Matches(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)'
        $changed = $true
    }
    
    # Reemplazar @IsUUID('all') por @Matches()
    if ($content -match "@IsUUID\('all'\)") {
        $content = $content -replace "@IsUUID\('all'\)", '@Matches(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)'
        $changed = $true
    }
    
    # Reemplazar @IsUUID('4') por @Matches()
    if ($content -match "@IsUUID\('4'\)") {
        $content = $content -replace "@IsUUID\('4'\)", '@Matches(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)'
        $changed = $true
    }
    
    # Reemplazar @IsUUID('4', { each: true }) por @Matches(..., { each: true })
    if ($content -match "@IsUUID\('4', \{ each: true \}\)") {
        $content = $content -replace "@IsUUID\('4', \{ each: true \}\)", '@Matches(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, { each: true })'
        $changed = $true
    }
    
    # Agregar import de Matches si no existe y se hicieron cambios
    if ($changed) {
        # Verificar si ya tiene import de Matches
        if ($content -notmatch "import.*Matches") {
            # Buscar línea de import de class-validator
            if ($content -match "import \{([^}]+)\} from 'class-validator';") {
                $imports = $matches[1]
                if ($imports -notmatch "Matches") {
                    # Agregar Matches al import existente
                    $newImports = $imports.Trim() + ", Matches"
                    $content = $content -replace "import \{[^}]+\} from 'class-validator';", "import { $newImports } from 'class-validator';"
                }
            }
        }
        
        # Remover IsUUID del import si ya no se usa
        if ($content -notmatch '@IsUUID') {
            $content = $content -replace ", IsUUID", ""
            $content = $content -replace "IsUUID, ", ""
            $content = $content -replace "{ IsUUID }", "{ }"
        }
        
        Set-Content $file.FullName -Value $content -NoNewline
        Write-Host "✓ Updated: $($file.FullName)" -ForegroundColor Green
    }
}

Write-Host "Done! All @IsUUID replaced with @Matches" -ForegroundColor Cyan
