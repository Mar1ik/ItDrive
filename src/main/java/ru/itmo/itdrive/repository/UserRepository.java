package ru.itmo.itdrive.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import ru.itmo.itdrive.model.User;

import java.math.BigDecimal;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    
    @Query(value = "SELECT public.create_user(:p_email, :p_password, :p_first_name, :p_last_name, :p_role, NULLIF(:p_phone_number, ''))", nativeQuery = true)
    Long createUser(@Param("p_email") String email,
                    @Param("p_password") String password,
                    @Param("p_first_name") String firstName,
                    @Param("p_last_name") String lastName,
                    @Param("p_role") String role,
                    @Param("p_phone_number") String phoneNumber);
    
    @Query(value = "SELECT public.update_user_rating(:p_user_id)", nativeQuery = true)
    BigDecimal updateUserRating(@Param("p_user_id") Long userId);
    
    @Modifying
    @Query(value = "UPDATE public.users SET is_blocked = :p_is_blocked, updated_at = NOW() WHERE id = :p_user_id", nativeQuery = true)
    void updateUserBlockedStatus(@Param("p_user_id") Long userId, @Param("p_is_blocked") Boolean isBlocked);
}
