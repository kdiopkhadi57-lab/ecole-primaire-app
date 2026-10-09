package com.school.repository;

import com.school.entity.Notification;
import com.school.entity.TypeNotification;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface NotificationRepository extends JpaRepository<Notification, Long> {
    List<Notification> findByAnneeScol(String anneeScol);
    List<Notification> findByType(TypeNotification type);
    List<Notification> findByEleveId(Long eleveId);
    List<Notification> findByMoisAndType(String mois, TypeNotification type);
    List<Notification> findBySemestreAndType(String semestre, TypeNotification type);
    List<Notification> findByStatutOrderByDateCreationDesc(String statut);
    List<Notification> findAllByOrderByDateCreationDesc();
}
