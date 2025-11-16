#!/bin/bash
# Script to switch between DBngin MySQL and DKG MySQL (Homebrew)

case "$1" in
    dkg|homebrew)
        echo "🔄 Stopping DBngin MySQL (if running)..."
        # DBngin is managed via its GUI, but we can check if it's using port 3306
        if lsof -i :3306 | grep -q DBngin; then
            echo "⚠️  DBngin MySQL is using port 3306. Please stop it from DBngin GUI first."
            exit 1
        fi
        
        echo "🚀 Starting DKG MySQL (Homebrew)..."
        brew services start mysql
        sleep 3
        
        if brew services list | grep -q "mysql.*started"; then
            echo "✅ DKG MySQL is now running"
            echo "📝 Connection info:"
            echo "   Host: 127.0.0.1"
            echo "   Port: 3306"
            echo "   User: root"
            echo "   Password: (check your .env file for DB_PASSWORD)"
        else
            echo "❌ Failed to start DKG MySQL"
            exit 1
        fi
        ;;
    
    dbngin|original)
        echo "🛑 Stopping DKG MySQL (Homebrew)..."
        brew services stop mysql
        sleep 2
        
        if ! brew services list | grep -q "mysql.*started"; then
            echo "✅ DKG MySQL stopped"
            echo "📝 You can now start DBngin MySQL from the DBngin GUI"
        else
            echo "⚠️  DKG MySQL might still be running"
        fi
        ;;
    
    status)
        echo "📊 MySQL Status:"
        echo ""
        echo "Homebrew MySQL (DKG):"
        brew services list | grep mysql
        echo ""
        echo "DBngin MySQL:"
        if ps aux | grep -q "[D]Bngin.*mysql"; then
            echo "   Status: Running"
            ps aux | grep "[D]Bngin.*mysql" | grep -v grep | head -1
        else
            echo "   Status: Not running (check DBngin GUI)"
        fi
        echo ""
        echo "Port 3306 usage:"
        lsof -i :3306 2>/dev/null | head -3 || echo "   Port 3306 is free"
        ;;
    
    *)
        echo "Usage: $0 {dkg|dbngin|status}"
        echo ""
        echo "Commands:"
        echo "  dkg      - Start DKG MySQL (Homebrew) and stop DBngin"
        echo "  dbngin   - Stop DKG MySQL (Homebrew) to use DBngin"
        echo "  status   - Show status of both MySQL instances"
        echo ""
        exit 1
        ;;
esac

