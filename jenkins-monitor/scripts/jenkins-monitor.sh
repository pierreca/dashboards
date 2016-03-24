### BEGIN INIT INFO
# Provides:             jenkins-monitor
# Required-Start:
# Required-Stop:
# Default-Start:        2 3 4 5
# Default-Stop:         0 1 6
# Short-Description:    Jenkins Monitor
### END INIT INFO

case "$1" in
  start)
    /usr/local/bin/forever -p /root/.forever --sourceDir=<PATH_TO_JENKINS_MONITOR> start monitor.js
    ;;
  stop)
    exec /usr/local/bin/forever stopall
    ;;
  *)

  echo "Usage: /etc/init.d/jenkins-monitor {start|stop}"
  exit 1
  ;;
esac
exit 0